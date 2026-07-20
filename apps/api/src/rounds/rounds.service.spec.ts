import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { RoundsService } from './rounds.service'
import { Round } from './round.entity'
import { Debate } from '../debates/debate.entity'
import { DebatesService } from '../debates/debates.service'
import { Repository, UpdateResult } from 'typeorm'

describe('RoundsService', () => {
  let service: RoundsService
  let roundRepo: jest.Mocked<Repository<Round>>
  let debatesService: jest.Mocked<DebatesService>

  const mockRound = (overrides?: Partial<Round>): Round => ({
    id: 'round-uuid-1',
    debate_id: 'debate-uuid-1',
    round_number: 1,
    speaker_id: 'user-1',
    audio_url: null,
    transcription: null,
    duration: null,
    created_at: new Date(),
    ...overrides,
  })

  const mockFullDebate = (overrides?: Partial<Debate>): Debate => ({
    id: 'debate-uuid-1',
    topic_id: 'topic-uuid-1',
    creator_id: 'user-1',
    opponent_id: 'user-2',
    status: 'active',
    winner_id: null,
    created_at: new Date(),
    completed_at: null,
    ...overrides,
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundsService,
        {
          provide: getRepositoryToken(Round),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: DebatesService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(RoundsService)
    roundRepo = module.get(getRepositoryToken(Round))
    debatesService = module.get(DebatesService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates round with correct data', async () => {
      debatesService.findById.mockResolvedValue({ success: true, data: mockFullDebate() })
      roundRepo.findOne.mockResolvedValue(null)
      roundRepo.create.mockReturnValue(mockRound())
      roundRepo.save.mockResolvedValue(mockRound())

      const result = await service.create('user-1', { debate_id: 'debate-uuid-1', round_number: 1 })

      expect(result.success).toBe(true)
      expect(result.data.speaker_id).toBe('user-1')
      expect(result.data.round_number).toBe(1)
    })

    it('throws BadRequestException for duplicate round_number+debate_id', async () => {
      debatesService.findById.mockResolvedValue({ success: true, data: mockFullDebate() })
      roundRepo.findOne.mockResolvedValue(mockRound())

      await expect(
        service.create('user-1', { debate_id: 'debate-uuid-1', round_number: 1 })
      ).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException for invalid round_number (0)', async () => {
      await expect(
        service.create('user-1', { debate_id: 'debate-uuid-1', round_number: 0 })
      ).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException for invalid round_number (4)', async () => {
      await expect(
        service.create('user-1', { debate_id: 'debate-uuid-1', round_number: 4 })
      ).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException for non-existent debate', async () => {
      debatesService.findById.mockRejectedValue(new NotFoundException('Debate not found'))

      await expect(
        service.create('user-1', { debate_id: 'nonexistent', round_number: 1 })
      ).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when speaker is not a participant', async () => {
      debatesService.findById.mockResolvedValue({ success: true, data: mockFullDebate() })

      await expect(
        service.create('user-99', { debate_id: 'debate-uuid-1', round_number: 1 })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('findByDebate', () => {
    it('returns rounds ordered by round_number ASC', async () => {
      const rounds = [
        mockRound({ round_number: 1 }),
        mockRound({ round_number: 2, id: 'round-2' }),
        mockRound({ round_number: 3, id: 'round-3' }),
      ]
      roundRepo.find.mockResolvedValue(rounds)

      const result = await service.findByDebate('debate-uuid-1')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.data[0].round_number).toBe(1)
      expect(result.data[2].round_number).toBe(3)
      expect(roundRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { round_number: 'ASC' } })
      )
    })

    it('returns empty array for debate with no rounds', async () => {
      roundRepo.find.mockResolvedValue([])

      const result = await service.findByDebate('debate-uuid-1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('updateRound', () => {
    it('updates transcription text', async () => {
      roundRepo.findOneBy.mockResolvedValue(mockRound({ speaker_id: 'user-1' }))
      roundRepo.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] } as UpdateResult)
      roundRepo.findOneBy.mockResolvedValue(mockRound({ transcription: 'hello world' }))

      const result = await service.updateRound('round-uuid-1', 'user-1', { transcription: 'hello world' })

      expect(result.success).toBe(true)
      expect(roundRepo.update).toHaveBeenCalledWith(
        'round-uuid-1',
        { transcription: 'hello world' }
      )
    })

    it('throws NotFoundException for non-existent round', async () => {
      roundRepo.findOneBy.mockResolvedValue(null)

      await expect(
        service.updateRound('nonexistent', 'user-1', { transcription: 'hello' })
      ).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when userId does not match speaker_id', async () => {
      roundRepo.findOneBy.mockResolvedValue(mockRound({ speaker_id: 'user-1' }))

      await expect(
        service.updateRound('round-uuid-1', 'user-99', { transcription: 'hello' })
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
