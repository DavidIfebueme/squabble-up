import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull, Not } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Debate } from './debate.entity'
import { GuestSession } from './guest-session.entity'
import { TopicsService } from '../topics/topics.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { GUEST_SESSION_TTL_HOURS } from '@squabble-up/shared'

const DEBATE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

@Injectable()
export class DebatesService implements OnModuleInit {
  private readonly pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    @InjectRepository(Debate)
    private readonly debateRepo: Repository<Debate>,
    @InjectRepository(GuestSession)
    private readonly guestSessionRepo: Repository<GuestSession>,
    private readonly topicsService: TopicsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async onModuleInit() {
    const pending = await this.debateRepo.find({ where: { status: 'pending' as const } })
    for (const debate of pending) {
      const elapsed = Date.now() - new Date(debate.created_at).getTime()
      const remaining = DEBATE_TIMEOUT_MS - elapsed
      if (remaining <= 0) {
        await this.debateRepo.update({ id: debate.id, status: 'pending' }, { status: 'abandoned' })
      } else {
        this.startAbandonTimer(debate.id, remaining)
      }
    }
  }

  private clampPagination(page: number, limit: number) {
    return { page: Math.max(1, page), limit: Math.min(Math.max(1, limit), 100) }
  }

  async findAll(status?: string, topicId?: string, page = 1, limit = 20) {
    const { page: p, limit: l } = this.clampPagination(page, limit)
    const where: Record<string, string> = {}
    if (status) where.status = status
    if (topicId) where.topic_id = topicId
    const [data, total] = await this.debateRepo.findAndCount({
      where,
      skip: (p - 1) * l,
      take: l,
      order: { created_at: 'DESC' },
    })
    return { success: true, data, page: p, limit: l, total, has_more: p * l < total }
  }

  async findOpen(page = 1, limit = 20) {
    const { page: p, limit: l } = this.clampPagination(page, limit)
    const [data, total] = await this.debateRepo.findAndCount({
      where: { status: 'pending' as const },
      select: ['id', 'topic_id', 'status', 'created_at'],
      skip: (p - 1) * l,
      take: l,
      order: { created_at: 'DESC' },
    })
    return { success: true, data, page: p, limit: l, total, has_more: p * l < total }
  }

  async findMy(userId: string, page = 1, limit = 20) {
    const { page: p, limit: l } = this.clampPagination(page, limit)
    const qb = this.debateRepo.createQueryBuilder('debate')
      .where('debate.creator_id = :userId OR debate.opponent_id = :userId', { userId })
      .orderBy('debate.created_at', 'DESC')
      .skip((p - 1) * l)
      .take(l)

    const [data, total] = await qb.getManyAndCount()
    return { success: true, data, page, limit, total, has_more: page * limit < total }
  }

  async findById(id: string) {
    const debate = await this.debateRepo.findOneBy({ id })
    if (!debate) throw new NotFoundException('Debate not found')
    return { success: true, data: debate }
  }

  async create(userId: string | null, body: { topic_id: string; participant_role?: 'creator' | 'opponent'; community_voting?: boolean }) {
    const role = body.participant_role ?? 'creator'
    const debate = this.debateRepo.create({
      topic_id: body.topic_id,
      creator_id: role === 'creator' ? userId : null,
      opponent_id: role === 'opponent' ? userId : null,
      status: 'pending',
      community_voting: body.community_voting ?? false,
    })
    await this.debateRepo.save(debate)
    await this.topicsService.incrementDebateCount(body.topic_id)

    this.startAbandonTimer(debate.id)

    const session = userId
      ? null
      : await this.createGuestSession(debate.id, role)

    return { success: true, data: { debate, guest_session: session } }
  }

  async join(debateId: string, userId: string | null) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.status !== 'pending') throw new BadRequestException('Debate is not open for joining')

    if (userId) {
      if (debate.creator_id === userId || debate.opponent_id === userId) {
        throw new BadRequestException('Already a participant in this debate')
      }
      const result = await this.debateRepo.update(
        { id: debateId, status: 'pending', opponent_id: IsNull() },
        { opponent_id: userId },
      )
      if (result.affected === 0) {
        const result2 = await this.debateRepo.update(
          { id: debateId, status: 'pending', creator_id: IsNull() },
          { creator_id: userId },
        )
        if (result2.affected === 0) {
          throw new BadRequestException('Debate is full')
        }
      }
      const updated = await this.debateRepo.findOneBy({ id: debateId })
      this.clearAbandonTimer(debateId)
      return { success: true, data: { debate: updated! } }
    }

    if (debate.creator_id && debate.opponent_id) {
      throw new BadRequestException('Debate is full')
    }
    const role = !debate.creator_id ? 'creator' : 'opponent'
    const guestId = `guest_${uuid()}`
    const result = role === 'creator'
      ? await this.debateRepo.update({ id: debateId, creator_id: IsNull() }, { creator_id: guestId })
      : await this.debateRepo.update({ id: debateId, opponent_id: IsNull() }, { opponent_id: guestId })
    if (result.affected === 0) throw new BadRequestException('Slot taken')
    const updated = await this.debateRepo.findOneBy({ id: debateId })
    const session = await this.createGuestSession(debateId, role)
    this.clearAbandonTimer(debateId)
    return { success: true, data: { debate: updated!, guest_session: session } }
  }

  async start(debateId: string, userId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.creator_id !== userId && debate.opponent_id !== userId) {
      throw new ForbiddenException('Only participants can start a debate')
    }
    if (!debate.creator_id || !debate.opponent_id) {
      throw new BadRequestException('Both participants required to start')
    }
    this.clearAbandonTimer(debateId)
    const result = await this.debateRepo.update(
      { id: debateId, status: 'pending' },
      { status: 'active' },
    )
    if (result.affected === 0) throw new BadRequestException('Debate is not in pending state')
    return { success: true, data: await this.debateRepo.findOneBy({ id: debateId }) }
  }

  async complete(debateId: string, userId?: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (userId && debate.creator_id !== userId && debate.opponent_id !== userId) {
      throw new ForbiddenException('Only participants can complete a debate')
    }
    const result = await this.debateRepo.update(
      { id: debateId, status: 'active' },
      { status: 'completed' as const, completed_at: new Date() },
    )
    if (result.affected === 0) {
      const check = await this.debateRepo.findOneBy({ id: debateId })
      if (check?.status === 'completed') {
        return { success: true, data: check }
      }
      throw new BadRequestException('Debate is not active')
    }
    const updated = await this.debateRepo.findOneBy({ id: debateId })
    this.realtimeGateway.emitDebateEvent(debateId, 'debate-completed', {
      debate_id: debateId,
      winner_id: updated!.winner_id,
    })
    return { success: true, data: updated }
  }

  async abandon(debateId: string, userId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.status !== 'pending' && debate.status !== 'active') {
      throw new BadRequestException('Debate cannot be abandoned in current state')
    }
    if (debate.creator_id !== userId && debate.opponent_id !== userId) {
      throw new ForbiddenException('Only participants can abandon a debate')
    }
    this.clearAbandonTimer(debateId)
    const wasActive = debate.status === 'active'
    debate.status = 'abandoned'
    await this.debateRepo.save(debate)
    if (wasActive) {
      this.realtimeGateway.emitDebateEvent(debateId, 'debate-abandoned', { reason: 'manual_abandon' })
    }
    return { success: true, data: debate }
  }

  async setScoringFailed(debateId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.status !== 'active') throw new BadRequestException('Debate is not active')
    await this.debateRepo.update({ id: debateId }, { status: 'scoring_failed' })
  }

  async setWinner(debateId: string, winnerId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.status !== 'active' && debate.status !== 'completed') {
      throw new BadRequestException('Debate must be active or completed to set a winner')
    }
    await this.debateRepo.update({ id: debateId }, { winner_id: winnerId })
  }

  async setAiScores(debateId: string, aiScores: {
    creator: { logic: number; persuasiveness: number; evidence: number; delivery: number }
    opponent: { logic: number; persuasiveness: number; evidence: number; delivery: number }
    reasoning: string
  }) {
    await this.debateRepo.update({ id: debateId }, { ai_scores: aiScores })
  }

  async getScores(debateId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    return { success: true, data: { ai_scores: debate.ai_scores } }
  }

  private async createGuestSession(debateId: string, role: 'creator' | 'opponent') {
    const session = this.guestSessionRepo.create({
      session_token: uuid(),
      debate_id: debateId,
      participant_role: role,
      expires_at: new Date(Date.now() + GUEST_SESSION_TTL_HOURS * 60 * 60 * 1000),
    })
    await this.guestSessionRepo.save(session)
    return session
  }

  private startAbandonTimer(debateId: string, ms = DEBATE_TIMEOUT_MS) {
    const timer = setTimeout(async () => {
      this.pendingTimers.delete(debateId)
      await this.debateRepo.update({ id: debateId, status: 'pending' }, { status: 'abandoned' })
    }, ms)
    this.pendingTimers.set(debateId, timer)
  }

  private clearAbandonTimer(debateId: string) {
    const timer = this.pendingTimers.get(debateId)
    if (timer) {
      clearTimeout(timer)
      this.pendingTimers.delete(debateId)
    }
  }

  async getScorecard(debateId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.status !== 'completed') throw new BadRequestException('Debate has not been scored yet')

    const topic = await this.topicsService.findById(debate.topic_id)

    return {
      success: true,
      data: {
        debate_id: debate.id,
        topic: topic.data,
        winner_id: debate.winner_id,
        creator_id: debate.creator_id,
        opponent_id: debate.opponent_id,
        completed_at: debate.completed_at,
        ai_scores: debate.ai_scores,
      },
    }
  }
}
