import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { of } from 'rxjs'
import { GeminiService } from './gemini.service'

describe('GeminiService', () => {
  let service: GeminiService
  let httpService: jest.Mocked<HttpService>

  const CREATOR_ID = 'creator-uuid-1'
  const OPPONENT_ID = 'opponent-uuid-1'

  const validTranscripts = [
    { round_number: 1, speaker_id: CREATOR_ID, transcription: 'Creator opening statement' },
    { round_number: 1, speaker_id: OPPONENT_ID, transcription: 'Opponent opening statement' },
    { round_number: 2, speaker_id: CREATOR_ID, transcription: 'Creator rebuttal' },
    { round_number: 2, speaker_id: OPPONENT_ID, transcription: 'Opponent rebuttal' },
    { round_number: 3, speaker_id: CREATOR_ID, transcription: 'Creator closing' },
    { round_number: 3, speaker_id: OPPONENT_ID, transcription: 'Opponent closing' },
  ]

  const geminiResponse = JSON.stringify({
    creator: { logic: 85, persuasiveness: 78, evidence: 90, delivery: 82 },
    opponent: { logic: 72, persuasiveness: 80, evidence: 65, delivery: 75 },
    reasoning: 'Creator won with stronger evidence.',
  })

  const mockAxiosResponse = (text: string) => ({
    data: { candidates: [{ content: { parts: [{ text }] } }] },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} },
  })

  const mockPost = (text: string) => of(mockAxiosResponse(text)) as ReturnType<HttpService['post']>

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-api-key'

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<GeminiService>(GeminiService)
    httpService = module.get(HttpService)
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  describe('scoreDebate', () => {
    it('returns parsed scores for valid input', async () => {
      httpService.post.mockReturnValue(mockPost(geminiResponse))

      const result = await service.scoreDebate('Test topic', validTranscripts, CREATOR_ID, OPPONENT_ID)

      expect(result.creator.logic).toBe(85)
      expect(result.creator.evidence).toBe(90)
      expect(result.opponent.logic).toBe(72)
      expect(result.reasoning).toBe('Creator won with stronger evidence.')
    })

    it('throws BadRequestException when fewer than 6 transcripts', async () => {
      await expect(
        service.scoreDebate('Topic', validTranscripts.slice(0, 4), CREATOR_ID, OPPONENT_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when GEMINI_API_KEY is missing', async () => {
      delete process.env.GEMINI_API_KEY

      await expect(
        service.scoreDebate('Topic', validTranscripts, CREATOR_ID, OPPONENT_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('maps speaker_id to creator/opponent sides correctly', async () => {
      httpService.post.mockReturnValue(mockPost(geminiResponse))

      await service.scoreDebate('Topic', validTranscripts, CREATOR_ID, OPPONENT_ID)

      const postedBody = httpService.post.mock.calls[0][1] as Record<string, unknown>
      const contents = postedBody.contents as Array<{ parts: Array<{ text: string }> }>
      const postedPrompt = contents[0].parts[0].text
      expect(postedPrompt).toContain('Creator opening statement')
      expect(postedPrompt).toContain('Opponent opening statement')
      expect(postedPrompt).toContain('Creator rebuttal')
      expect(postedPrompt).toContain('Opponent rebuttal')
      expect(postedPrompt).toContain('Creator closing')
      expect(postedPrompt).toContain('Opponent closing')
    })

    it('returns 50/50 fallback on invalid JSON response', async () => {
      httpService.post.mockReturnValue(mockPost('not json at all'))

      const result = await service.scoreDebate('Topic', validTranscripts, CREATOR_ID, OPPONENT_ID)

      expect(result.creator.logic).toBe(50)
      expect(result.opponent.logic).toBe(50)
      expect(result.reasoning).toBe('Scoring completed but detailed reasoning was unavailable.')
    })

    it('normalizes scores to 0-100 range', async () => {
      const overScored = JSON.stringify({
        creator: { logic: 150, persuasiveness: -10, evidence: 50, delivery: 75 },
        opponent: { logic: 60, persuasiveness: 70, evidence: 80, delivery: 90 },
        reasoning: 'Test.',
      })
      httpService.post.mockReturnValue(mockPost(overScored))

      const result = await service.scoreDebate('Topic', validTranscripts, CREATOR_ID, OPPONENT_ID)

      expect(result.creator.logic).toBe(100)
      expect(result.creator.persuasiveness).toBe(0)
    })
  })
})
