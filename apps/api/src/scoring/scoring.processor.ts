import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { SCORING_QUEUE } from './scoring.module'
import { VotesService } from '../votes/votes.service'
import { DebatesService } from '../debates/debates.service'
import { UsersService } from '../users/users.service'
import { RoundsService } from '../rounds/rounds.service'
import { TopicsService } from '../topics/topics.service'
import { GeminiService } from './gemini.service'
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
  ) {
    super()
  }

  async process(job: Job<{ debateId: string }>) {
    const { debateId } = job.data

    try {
      const debateResult = await this.debatesService.findById(debateId)
      const debate = debateResult.data
      if (!debate) return
      if (debate.status !== 'active') return

      const topicResult = await this.topicsService.findById(debate.topic_id)
      if (!topicResult.data) return

      const roundsResult = await this.roundsService.findByDebate(debateId)
      const rounds = roundsResult.data
      if (!rounds || rounds.length < 6) return

      const creatorId = debate.creator_id
      const opponentId = debate.opponent_id
      if (!creatorId || !opponentId) return

      const transcripts = rounds.map(r => ({
        round_number: r.round_number,
        speaker_id: r.speaker_id,
        transcription: r.transcription || '',
      }))

      const aiScores = await this.geminiService.scoreDebate(
        topicResult.data.title,
        transcripts,
        creatorId,
        opponentId,
      )

      const creatorAi = (aiScores.creator.logic + aiScores.creator.persuasiveness + aiScores.creator.evidence + aiScores.creator.delivery) / 4
      const opponentAi = (aiScores.opponent.logic + aiScores.opponent.persuasiveness + aiScores.opponent.evidence + aiScores.opponent.delivery) / 4

      const aggregateScores = await this.votesService.getAggregateScores(debateId)

      let finalCreator: number
      let finalOpponent: number

      if (aggregateScores) {
        finalCreator = aggregateScores.creator * COMMUNITY_WEIGHT + creatorAi * AI_WEIGHT
        finalOpponent = aggregateScores.opponent * COMMUNITY_WEIGHT + opponentAi * AI_WEIGHT
      } else {
        finalCreator = creatorAi
        finalOpponent = opponentAi
      }

      const diff = Math.abs(finalCreator - finalOpponent)
      let winnerId: string
      let loserId: string

      if (diff > 2) {
        winnerId = finalCreator > finalOpponent ? creatorId : opponentId
        loserId = winnerId === creatorId ? opponentId : creatorId
      } else {
        const creatorLogic = aiScores.creator.logic
        const opponentLogic = aiScores.opponent.logic
        if (creatorLogic !== opponentLogic) {
          winnerId = creatorLogic > opponentLogic ? creatorId : opponentId
          loserId = winnerId === creatorId ? opponentId : creatorId
        } else {
          winnerId = aiScores.creator.evidence > aiScores.opponent.evidence ? creatorId : opponentId
          loserId = winnerId === creatorId ? opponentId : creatorId
        }
      }

      await this.debatesService.setAiScores(debateId, aiScores)
      await this.debatesService.setWinner(debateId, winnerId)
      await this.debatesService.complete(debateId)

      if (!winnerId.startsWith('guest_') && !loserId.startsWith('guest_')) {
        await this.usersService.updateElo(winnerId, loserId)
      }
    } catch {
      const isLastAttempt = job.attemptsMade >= 1
      if (isLastAttempt) {
        await this.debatesService.setScoringFailed(debateId)
      }
      throw job
    }
  }
}
