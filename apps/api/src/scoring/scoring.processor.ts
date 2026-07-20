import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { SCORING_QUEUE } from './scoring.module'
import { VotesService } from '../votes/votes.service'
import { DebatesService } from '../debates/debates.service'
import { UsersService } from '../users/users.service'
import { RoundsService } from '../rounds/rounds.service'
import { TopicsService } from '../topics/topics.service'
import { GeminiService } from './gemini.service'
import { ContentFilterService } from './content-filter.service'
import { COMMUNITY_WEIGHT, AI_WEIGHT } from '@squabble-up/shared'

@Processor(SCORING_QUEUE)
export class ScoringProcessor extends WorkerHost {
  constructor(
    private readonly votesService: VotesService,
    private readonly debatesService: DebatesService,
    private readonly usersService: UsersService,
    private readonly roundsService: RoundsService,
    private readonly topicsService: TopicsService,
    private readonly geminiService: GeminiService,
    private readonly contentFilter: ContentFilterService,
  ) {
    super()
  }

  async process(job: Job<{ debateId: string }>) {
    const { debateId } = job.data

    try {
      const aggregateScores = await this.votesService.getAggregateScores(debateId)
      const debateResult = await this.debatesService.findById(debateId)
      const debate = debateResult.data
      if (!debate) return

      const roundsResult = await this.roundsService.findByDebate(debateId)
      const rounds = roundsResult.data

      for (const round of rounds) {
        if (round.transcription) {
          const result = this.contentFilter.filter(round.transcription)
          if (result.flagged) {
            await this.debatesService.setScoringFailed(debateId)
            return
          }
        }
      }

      const topicResult = await this.topicsService.findById(debate.topic_id)
      const topic = topicResult.data

      const transcripts = rounds.map(r => ({
        round_number: r.round_number,
        speaker_id: r.speaker_id,
        transcription: r.transcription || '',
      }))

      const aiScores = await this.geminiService.scoreDebate(topic.title, transcripts)

      const creatorAi = (aiScores.creator.logic + aiScores.creator.persuasiveness + aiScores.creator.evidence + aiScores.creator.delivery) / 4
      const opponentAi = (aiScores.opponent.logic + aiScores.opponent.persuasiveness + aiScores.opponent.evidence + aiScores.opponent.delivery) / 4

      let finalCreator: number
      let finalOpponent: number

      if (aggregateScores) {
        finalCreator = aggregateScores.creator * COMMUNITY_WEIGHT + creatorAi * AI_WEIGHT
        finalOpponent = aggregateScores.opponent * COMMUNITY_WEIGHT + opponentAi * AI_WEIGHT
      } else {
        finalCreator = creatorAi
        finalOpponent = opponentAi
      }

      const winnerId = finalCreator >= finalOpponent ? debate.creator_id! : debate.opponent_id!
      const loserId = winnerId === debate.creator_id ? debate.opponent_id : debate.creator_id

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
}
