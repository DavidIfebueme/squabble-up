import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Vote } from './vote.entity'

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
  ) {}

  async findByDebate(debateId: string) {
    const votes = await this.voteRepo.find({ where: { debate_id: debateId } })
    return { success: true, data: votes }
  }

  async submit(voterId: string, data: Pick<Vote, 'debate_id' | 'vote_type' | 'logic_score' | 'evidence_score' | 'delivery_score'>) {
    const existing = await this.voteRepo.findOneBy({ debate_id: data.debate_id, voter_id: voterId })
    if (existing) throw new ConflictException('Already voted on this debate')

    const vote = this.voteRepo.create({ ...data, voter_id: voterId })
    await this.voteRepo.save(vote)
    return { success: true, data: vote }
  }

  async getAggregateScores(debateId: string) {
    const votes = await this.voteRepo.find({ where: { debate_id: debateId } })
    if (votes.length === 0) return { creator: 0, opponent: 0 }

    const scores = { creator: 0, opponent: 0 }
    for (const v of votes) {
      const avg = (v.logic_score + v.evidence_score + v.delivery_score) / 3
      if (v.vote_type === 'creator') scores.creator += avg
      else scores.opponent += avg
    }
    return scores
  }
}
