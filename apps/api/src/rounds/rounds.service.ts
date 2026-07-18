import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Round } from './round.entity'

@Injectable()
export class RoundsService {
  constructor(
    @InjectRepository(Round)
    private readonly roundRepo: Repository<Round>,
  ) {}

  async findByDebate(debateId: string) {
    const rounds = await this.roundRepo.find({
      where: { debate_id: debateId },
      order: { round_number: 'ASC' },
    })
    return { success: true, data: rounds }
  }

  async create(data: Pick<Round, 'debate_id' | 'round_number' | 'speaker_id'>) {
    const round = this.roundRepo.create(data)
    await this.roundRepo.save(round)
    return { success: true, data: round }
  }

  async updateRound(id: string, data: Partial<Pick<Round, 'audio_url' | 'transcription' | 'duration'>>) {
    await this.roundRepo.update(id, data)
    const round = await this.roundRepo.findOneBy({ id })
    return { success: true, data: round }
  }
}
