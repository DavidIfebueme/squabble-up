import { Test, TestingModule } from '@nestjs/testing'
import { Job } from 'bullmq'
import { ScoringProcessor } from './scoring.processor'
import { VotesService } from '../votes/votes.service'
import { DebatesService } from '../debates/debates.service'
import { UsersService } from '../users/users.service'
import { RoundsService } from '../rounds/rounds.service'
import { TopicsService } from '../topics/topics.service'
import { GeminiService } from './gemini.service'
import { ContentFilterService } from './content-filter.service'

describe('ScoringProcessor', () => {
  let processor: ScoringProcessor
  let votesService: jest.Mocked<VotesService>
  let debatesService: jest.Mocked<DebatesService>
  let usersService: jest.Mocked<UsersService>
  let roundsService: jest.Mocked<RoundsService>
  let topicsService: jest.Mocked<TopicsService>
  let geminiService: jest.Mocked<GeminiService>

  const debateId = 'debate-uuid-1'
  const creatorId = 'creator-uuid-1'
  const opponentId = 'opponent-uuid-1'

  const mockDebate = {
    id: debateId,
    topic_id: 'topic-uuid-1',
    creator_id: creatorId,
    opponent_id: opponentId,
    status: 'active' as const,
    winner_id: null,
    ai_scores: null,
    community_voting: false,
    created_at: new Date(),
    completed_at: null,
  }

  const mockTopic = { id: 'topic-uuid-1', title: 'Test Topic', slug: 'test', description: '', category: '', created_by: null, debate_count: 0, created_at: new Date() }

  const mockRounds = [
    { id: 'r1', debate_id: debateId, round_number: 1, speaker_id: creatorId, audio_url: null, transcription: 'Creator R1', duration: null, created_at: new Date() },
    { id: 'r2', debate_id: debateId, round_number: 1, speaker_id: opponentId, audio_url: null, transcription: 'Opponent R1', duration: null, created_at: new Date() },
    { id: 'r3', debate_id: debateId, round_number: 2, speaker_id: creatorId, audio_url: null, transcription: 'Creator R2', duration: null, created_at: new Date() },
    { id: 'r4', debate_id: debateId, round_number: 2, speaker_id: opponentId, audio_url: null, transcription: 'Opponent R2', duration: null, created_at: new Date() },
    { id: 'r5', debate_id: debateId, round_number: 3, speaker_id: creatorId, audio_url: null, transcription: 'Creator R3', duration: null, created_at: new Date() },
    { id: 'r6', debate_id: debateId, round_number: 3, speaker_id: opponentId, audio_url: null, transcription: 'Opponent R3', duration: null, created_at: new Date() },
  ]

  const aiScores = {
    creator: { logic: 85, persuasiveness: 78, evidence: 90, delivery: 82 },
    opponent: { logic: 72, persuasiveness: 80, evidence: 65, delivery: 75 },
    reasoning: 'Creator won.',
  }

  const createJob = (overrides?: Partial<Job<{ debateId: string }>>): Job<{ debateId: string }> =>
    ({ data: { debateId }, attemptsMade: 0, ...overrides }) as Job<{ debateId: string }>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringProcessor,
        {
          provide: VotesService,
          useValue: { getAggregateScores: jest.fn() },
        },
        {
          provide: DebatesService,
          useValue: {
            findById: jest.fn(),
            setAiScores: jest.fn(),
            setWinner: jest.fn(),
            complete: jest.fn(),
            setScoringFailed: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: { updateElo: jest.fn() },
        },
        {
          provide: RoundsService,
          useValue: { findByDebate: jest.fn() },
        },
        {
          provide: TopicsService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: GeminiService,
          useValue: { scoreDebate: jest.fn() },
        },
        {
          provide: ContentFilterService,
          useValue: { filter: jest.fn().mockReturnValue({ flagged: false }) },
        },
      ],
    }).compile()

    processor = module.get<ScoringProcessor>(ScoringProcessor)
    votesService = module.get(VotesService)
    debatesService = module.get(DebatesService)
    usersService = module.get(UsersService)
    roundsService = module.get(RoundsService)
    topicsService = module.get(TopicsService)
    geminiService = module.get(GeminiService)

    debatesService.findById.mockResolvedValue({ success: true, data: mockDebate })
    topicsService.findById.mockResolvedValue({ success: true, data: mockTopic })
    roundsService.findByDebate.mockResolvedValue({ success: true, data: mockRounds })
    votesService.getAggregateScores.mockResolvedValue({ creator: 0, opponent: 0 })
    geminiService.scoreDebate.mockResolvedValue(aiScores)
  })

  describe('process', () => {
    it('scores debate and sets winner based on AI scores', async () => {
      const job = createJob()

      await processor.process(job)

      expect(geminiService.scoreDebate).toHaveBeenCalledWith(
        'Test Topic',
        expect.arrayContaining([expect.objectContaining({ round_number: 1 })]),
        creatorId,
        opponentId,
      )
      expect(debatesService.setAiScores).toHaveBeenCalledWith(debateId, aiScores)
      expect(debatesService.setWinner).toHaveBeenCalledWith(debateId, creatorId)
      expect(debatesService.complete).toHaveBeenCalledWith(debateId)
      expect(usersService.updateElo).toHaveBeenCalledWith(creatorId, opponentId)
    })

    it('returns early when debate is not active', async () => {
      debatesService.findById.mockResolvedValue({ success: true, data: { ...mockDebate, status: 'completed' } })
      const job = createJob()

      await processor.process(job)

      expect(geminiService.scoreDebate).not.toHaveBeenCalled()
    })

    it('returns early when fewer than 6 rounds', async () => {
      roundsService.findByDebate.mockResolvedValue({ success: true, data: mockRounds.slice(0, 4) })
      const job = createJob()

      await processor.process(job)

      expect(geminiService.scoreDebate).not.toHaveBeenCalled()
    })

    it('returns early when creator_id is missing', async () => {
      debatesService.findById.mockResolvedValue({ success: true, data: { ...mockDebate, creator_id: null } })
      const job = createJob()

      await processor.process(job)

      expect(geminiService.scoreDebate).not.toHaveBeenCalled()
    })

    it('returns early when opponent_id is missing', async () => {
      debatesService.findById.mockResolvedValue({ success: true, data: { ...mockDebate, opponent_id: null } })
      const job = createJob()

      await processor.process(job)

      expect(geminiService.scoreDebate).not.toHaveBeenCalled()
    })

    it('uses tiebreaker when scores within 2 points - higher logic wins', async () => {
      const closeScores = {
        creator: { logic: 82, persuasiveness: 80, evidence: 80, delivery: 80 },
        opponent: { logic: 80, persuasiveness: 80, evidence: 80, delivery: 80 },
        reasoning: 'Tie.',
      }
      geminiService.scoreDebate.mockResolvedValue(closeScores)
      const job = createJob()

      await processor.process(job)

      expect(debatesService.setWinner).toHaveBeenCalledWith(debateId, creatorId)
    })

    it('uses evidence tiebreaker when logic also ties', async () => {
      const tiedScores = {
        creator: { logic: 80, persuasiveness: 80, evidence: 85, delivery: 80 },
        opponent: { logic: 80, persuasiveness: 80, evidence: 70, delivery: 80 },
        reasoning: 'Tie.',
      }
      geminiService.scoreDebate.mockResolvedValue(tiedScores)
      const job = createJob()

      await processor.process(job)

      expect(debatesService.setWinner).toHaveBeenCalledWith(debateId, creatorId)
    })

    it('marks scoring_failed on last attempt', async () => {
      geminiService.scoreDebate.mockRejectedValue(new Error('API error'))
      const job = createJob({ attemptsMade: 1 })

      let threw = false
      try {
        await processor.process(job)
      } catch {
        threw = true
      }
      expect(threw).toBe(true)
      expect(debatesService.setScoringFailed).toHaveBeenCalledWith(debateId)
    })

    it('re-throws without marking failed on first attempt', async () => {
      geminiService.scoreDebate.mockRejectedValue(new Error('API error'))
      const job = createJob({ attemptsMade: 0 })

      let threw = false
      try {
        await processor.process(job)
      } catch {
        threw = true
      }
      expect(threw).toBe(true)
      expect(debatesService.setScoringFailed).not.toHaveBeenCalled()
    })
  })
})
