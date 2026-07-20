import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Debate } from './debate.entity'
import { GuestSession } from './guest-session.entity'
import { TopicsService } from '../topics/topics.service'
import { GUEST_SESSION_TTL_HOURS } from '@squabble-up/shared'

const DEBATE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

@Injectable()
export class DebatesService {
  private readonly pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

  constructor(
    @InjectRepository(Debate)
    private readonly debateRepo: Repository<Debate>,
    @InjectRepository(GuestSession)
    private readonly guestSessionRepo: Repository<GuestSession>,
    private readonly topicsService: TopicsService,
  ) {}

  async findAll(status?: string, page = 1, limit = 20) {
    const where: Record<string, string> = status ? { status } : {}
    const [data, total] = await this.debateRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    })
    return { success: true, data, page, limit, total, has_more: page * limit < total }
  }

  async findOpen(page = 1, limit = 20) {
    const [data, total] = await this.debateRepo.findAndCount({
      where: { status: 'pending' as const },
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    })
    return { success: true, data, page, limit, total, has_more: page * limit < total }
  }

  async findMy(userId: string, page = 1, limit = 20) {
    const qb = this.debateRepo.createQueryBuilder('debate')
      .where('debate.creator_id = :userId OR debate.opponent_id = :userId', { userId })
      .orderBy('debate.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [data, total] = await qb.getManyAndCount()
    return { success: true, data, page, limit, total, has_more: page * limit < total }
  }

  async findById(id: string) {
    const debate = await this.debateRepo.findOneBy({ id })
    if (!debate) throw new NotFoundException('Debate not found')
    return { success: true, data: debate }
  }

  async create(userId: string | null, body: { topic_id: string; participant_role?: 'creator' | 'opponent' }) {
    const role = body.participant_role ?? 'creator'
    const debate = this.debateRepo.create({
      topic_id: body.topic_id,
      creator_id: role === 'creator' ? userId : null,
      opponent_id: role === 'opponent' ? userId : null,
      status: 'pending',
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
      if (!debate.creator_id) debate.creator_id = userId
      else if (!debate.opponent_id) debate.opponent_id = userId
      else throw new BadRequestException('Debate is full')
    } else {
      const role = !debate.creator_id ? 'creator' : 'opponent'
      if (role === 'creator') debate.creator_id = `guest_${uuid()}`
      else debate.opponent_id = `guest_${uuid()}`
      const session = await this.createGuestSession(debateId, role)
      await this.debateRepo.save(debate)
      this.clearAbandonTimer(debateId)
      return { success: true, data: { debate, guest_session: session } }
    }

    await this.debateRepo.save(debate)
    this.clearAbandonTimer(debateId)
    return { success: true, data: { debate } }
  }

  async start(debateId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.status !== 'pending') throw new BadRequestException('Debate is not in pending state')
    if (!debate.creator_id || !debate.opponent_id) {
      throw new BadRequestException('Both participants required to start')
    }
    this.clearAbandonTimer(debateId)
    debate.status = 'active'
    await this.debateRepo.save(debate)
    return { success: true, data: debate }
  }

  async complete(debateId: string) {
    const debate = await this.debateRepo.findOneBy({ id: debateId })
    if (!debate) throw new NotFoundException('Debate not found')
    if (debate.status !== 'active') throw new BadRequestException('Debate is not active')
    debate.status = 'completed'
    debate.completed_at = new Date()
    await this.debateRepo.save(debate)
    return { success: true, data: debate }
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
    debate.status = 'abandoned'
    await this.debateRepo.save(debate)
    return { success: true, data: debate }
  }

  async setScoringFailed(debateId: string) {
    await this.debateRepo.update({ id: debateId }, { status: 'scoring_failed' })
  }

  async setWinner(debateId: string, winnerId: string) {
    await this.debateRepo.update({ id: debateId }, { winner_id: winnerId })
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

  private startAbandonTimer(debateId: string) {
    const timer = setTimeout(async () => {
      this.pendingTimers.delete(debateId)
      const debate = await this.debateRepo.findOneBy({ id: debateId })
      if (debate && debate.status === 'pending') {
        debate.status = 'abandoned'
        await this.debateRepo.save(debate)
      }
    }, DEBATE_TIMEOUT_MS)
    this.pendingTimers.set(debateId, timer)
  }

  private clearAbandonTimer(debateId: string) {
    const timer = this.pendingTimers.get(debateId)
    if (timer) {
      clearTimeout(timer)
      this.pendingTimers.delete(debateId)
    }
  }
}
