import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Round } from './round.entity'
import { DebatesService } from '../debates/debates.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { DEBATE_ROUNDS } from '@squabble-up/shared'

@Injectable()
export class RoundsService {
  constructor(
    @InjectRepository(Round)
    private readonly roundRepo: Repository<Round>,
    private readonly debatesService: DebatesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async findByDebate(debateId: string) {
    const rounds = await this.roundRepo.find({
      where: { debate_id: debateId },
      order: { round_number: 'ASC' },
    })
    return { success: true, data: rounds }
  }

  async create(userId: string, data: { debate_id: string; round_number: number }) {
    if (data.round_number < 1 || data.round_number > DEBATE_ROUNDS) {
      throw new BadRequestException(`Round number must be between 1 and ${DEBATE_ROUNDS}`)
    }

    const debateResult = await this.debatesService.findById(data.debate_id)
    const debate = debateResult.data
    if (!debate) throw new NotFoundException('Debate not found')

    if (debate.creator_id !== userId && debate.opponent_id !== userId) {
      throw new ForbiddenException('Only debate participants can create rounds')
    }

    const existing = await this.roundRepo.findOne({
      where: { debate_id: data.debate_id, round_number: data.round_number },
    })
    if (existing) throw new BadRequestException('Round already exists for this debate')

    const round = this.roundRepo.create({
      debate_id: data.debate_id,
      round_number: data.round_number,
      speaker_id: userId,
    })
    await this.roundRepo.save(round)

    this.realtimeGateway.emitDebateEvent(data.debate_id, 'round-started', {
      round_number: data.round_number,
      speaker_id: userId,
    })

    return { success: true, data: round }
  }

  async updateRound(id: string, userId: string, data: { transcription?: string; duration?: number }) {
    const round = await this.roundRepo.findOneBy({ id })
    if (!round) throw new NotFoundException('Round not found')
    if (round.speaker_id !== userId) throw new ForbiddenException('Only the round speaker can update this round')

    await this.roundRepo.update(id, data)
    const updated = await this.roundRepo.findOneBy({ id })

    this.realtimeGateway.emitDebateEvent(round.debate_id, 'round-submitted', {
      round_number: round.round_number,
      speaker_id: userId,
    })

    return { success: true, data: updated }
  }
}
