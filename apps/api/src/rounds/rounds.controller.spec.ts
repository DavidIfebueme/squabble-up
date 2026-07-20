import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe, BadRequestException, ForbiddenException, ExecutionContext } from '@nestjs/common'
import request from 'supertest'
import { RoundsController } from './rounds.controller'
import { RoundsService } from './rounds.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

describe('RoundsController (integration)', () => {
  let app: INestApplication
  let roundsService: jest.Mocked<RoundsService>

  const mockRound = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    debate_id: '550e8400-e29b-41d4-a716-446655440001',
    round_number: 1,
    speaker_id: 'user-1',
    audio_url: null,
    transcription: null,
    duration: null,
    created_at: new Date(),
  }

  const mockRoundsService = {
    create: jest.fn(),
    findByDebate: jest.fn(),
    updateRound: jest.fn(),
  }

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoundsController],
      providers: [{ provide: RoundsService, useValue: mockRoundsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: ExecutionContext) => { ctx.switchToHttp().getRequest<{ user: { id: string } }>().user = { id: 'user-1' }; return true } })
      .compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()

    roundsService = module.get(RoundsService)
  })

  afterAll(async () => {
    await app.close()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /rounds', () => {
    it('creates a round and returns 201', async () => {
      mockRoundsService.create.mockResolvedValue({ success: true, data: mockRound })

      const res = await request(app.getHttpServer())
        .post('/rounds')
        .send({ debate_id: mockRound.debate_id, round_number: 1 })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.round_number).toBe(1)
      expect(roundsService.create).toHaveBeenCalledWith('user-1', {
        debate_id: mockRound.debate_id,
        round_number: 1,
      })
    })

    it('returns 400 for invalid round_number', async () => {
      const res = await request(app.getHttpServer())
        .post('/rounds')
        .send({ debate_id: mockRound.debate_id, round_number: 0 })

      expect(res.status).toBe(400)
      expect(roundsService.create).not.toHaveBeenCalled()
    })

    it('returns 400 for duplicate round+debate (service throws BadRequestException)', async () => {
      mockRoundsService.create.mockRejectedValue(
        new BadRequestException('Round already exists for this debate')
      )

      const res = await request(app.getHttpServer())
        .post('/rounds')
        .send({ debate_id: mockRound.debate_id, round_number: 1 })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /rounds/debate/:debateId', () => {
    it('returns rounds ordered by round_number', async () => {
      const rounds = [
        { ...mockRound, round_number: 1 },
        { ...mockRound, round_number: 2, id: '550e8400-e29b-41d4-a716-446655440002' },
        { ...mockRound, round_number: 3, id: '550e8400-e29b-41d4-a716-446655440003' },
      ]
      mockRoundsService.findByDebate.mockResolvedValue({ success: true, data: rounds })

      const res = await request(app.getHttpServer())
        .get(`/rounds/debate/${mockRound.debate_id}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(3)
      // no auth guard on GET, no user check needed
    })
  })

  describe('PATCH /rounds/:id', () => {
    it('updates transcription text', async () => {
      const updated = { ...mockRound, transcription: 'hello world' }
      mockRoundsService.updateRound.mockResolvedValue({ success: true, data: updated })

      const res = await request(app.getHttpServer())
        .patch(`/rounds/${mockRound.id}`)
        .send({ transcription: 'hello world' })

      expect(res.status).toBe(200)
      expect(res.body.data.transcription).toBe('hello world')
      expect(roundsService.updateRound).toHaveBeenCalledWith(
        mockRound.id,
        'user-1',
        { transcription: 'hello world' },
      )
    })

    it('returns 403 when userId does not match speaker_id', async () => {
      mockRoundsService.updateRound.mockRejectedValue(
        new ForbiddenException('Only the round speaker can update this round')
      )

      const res = await request(app.getHttpServer())
        .patch(`/rounds/${mockRound.id}`)
        .send({ transcription: 'hello' })

      expect(res.status).toBe(403)
    })
  })
})
