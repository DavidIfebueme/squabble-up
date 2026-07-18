import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { SCORING_QUEUE } from './scoring.module'
import { VotesService } from '../votes/votes.service'
import { DebatesService } from '../debates/debates.service'
import { UsersService } from '../users/users.service'
import { COMMUNITY_WEIGHT, AI_WEIGHT } from '@squabble-up/shared'

@Processor(SCORING_QUEUE)
export class ScoringProcessor extends WorkerHost {
  constructor(
    private readonly votesService: VotesService,
    private readonly debatesService: DebatesService,
    private readonly usersService: UsersService,
  ) {
    super()
  }

  async process(job: Job<{ debateId: string }>) {
    const { debateId } = job.data

    try {
      const scores = await this.votesService.getAggregateScores(debateId)
      const aiScores = await this.runAiScoring(debateId)

      const finalCreator = scores.creator * COMMUNITY_WEIGHT + aiScores.creator * AI_WEIGHT
      const finalOpponent = scores.opponent * COMMUNITY_WEIGHT + aiScores.opponent * AI_WEIGHT

      const debate = await this.debatesService.findById(debateId)
      const d = debate.data
      if (!d) return

      const winnerId = finalCreator >= finalOpponent ? d.creator_id! : d.opponent_id!
      const loserId = winnerId === d.creator_id ? d.opponent_id : d.creator_id

      await this.debatesService.setWinner(debateId, winnerId)
      await this.debatesService.complete(debateId)

      if (winnerId && loserId && !winnerId.startsWith('guest_') && !loserId.startsWith('guest_')) {
        await this.usersService.updateElo(winnerId, loserId)
      }
    } catch {
      await this.debatesService.setScoringFailed(debateId)
      throw job
    }
  }

  private async runAiScoring(_debateId: string) {
    return { creator: 5, opponent: 5 }
  }
}
