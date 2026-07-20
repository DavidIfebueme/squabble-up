import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { DebatesService } from './debates.service'
import { Debate } from './debate.entity'
import { GuestSession } from './guest-session.entity'
import { TopicsService } from '../topics/topics.service'
import { Repository } from 'typeorm'

describe('DebatesService', () => {
  let service: DebatesService
  let debateRepo: jest.Mocked<Repository<Debate>>
  let topicsService: jest.Mocked<TopicsService>

  const createMockDebate = (overrides?: Partial<Debate>): Debate => ({
    id: 'debate-uuid-1',
    topic_id: 'topic-uuid-1',
    creator_id: 'user-1',
    opponent_id: null,
    status: 'pending',
    winner_id: null,
    created_at: new Date(),
    completed_at: null,
    ...overrides,
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebatesService,
        {
          provide: getRepositoryToken(Debate),
          useValue: {
            findAndCount: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(GuestSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: TopicsService,
          useValue: {
            incrementDebateCount: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(DebatesService)
    debateRepo = module.get(getRepositoryToken(Debate))
    topicsService = module.get(TopicsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('create', () => {
    it('creates debate with status=pending and creator_id set', async () => {
      const debate = createMockDebate()
      debateRepo.create.mockReturnValue(debate)
      debateRepo.save.mockResolvedValue(debate)

      const result = await service.create('user-1', { topic_id: 'topic-uuid-1' })

      expect(result.success).toBe(true)
      expect(result.data.debate.status).toBe('pending')
      expect(result.data.debate.creator_id).toBe('user-1')
      expect(topicsService.incrementDebateCount).toHaveBeenCalledWith('topic-uuid-1')
    })

    it('creates with participant_role=creator sets creator', async () => {
      const debate = createMockDebate()
      debateRepo.create.mockReturnValue(debate)
      debateRepo.save.mockResolvedValue(debate)

      await service.create('user-1', { topic_id: 'topic-uuid-1', participant_role: 'creator' })

      expect(debateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ creator_id: 'user-1', opponent_id: null })
      )
    })

    it('creates with participant_role=opponent sets opponent', async () => {
      const opponentDebate = createMockDebate({ creator_id: null, opponent_id: 'user-1' })
      debateRepo.create.mockReturnValue(opponentDebate)
      debateRepo.save.mockResolvedValue(opponentDebate)

      await service.create('user-1', { topic_id: 'topic-uuid-1', participant_role: 'opponent' })

      expect(debateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ creator_id: null, opponent_id: 'user-1' })
      )
    })
  })

  describe('join', () => {
    it('assigns opponent to pending debate', async () => {
      const debate = createMockDebate()
      debateRepo.findOneBy.mockResolvedValue(debate)
      debateRepo.save.mockResolvedValue({ ...debate, opponent_id: 'user-2' })

      const result = await service.join('debate-uuid-1', 'user-2')

      expect(result.success).toBe(true)
      expect(result.data.debate.opponent_id).toBe('user-2')
    })

    it('throws NotFoundException for non-existent debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(null)

      await expect(service.join('nonexistent', 'user-2')).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException for non-pending debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ status: 'active', opponent_id: 'user-2' }))

      await expect(service.join('debate-uuid-1', 'user-2')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when already a participant', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate())

      await expect(service.join('debate-uuid-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when debate is full', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ opponent_id: 'user-2' }))

      await expect(service.join('debate-uuid-1', 'user-3')).rejects.toThrow(BadRequestException)
    })
  })

  describe('start', () => {
    it('sets status=active with both participants', async () => {
      const debate = createMockDebate({ opponent_id: 'user-2' })
      debateRepo.findOneBy.mockResolvedValue(debate)
      debateRepo.save.mockResolvedValue({ ...debate, status: 'active' })

      const result = await service.start('debate-uuid-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('active')
    })

    it('throws BadRequestException with missing opponent', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate())

      await expect(service.start('debate-uuid-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException with non-pending debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ status: 'active', opponent_id: 'user-2' }))

      await expect(service.start('debate-uuid-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException for non-existent debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(null)

      await expect(service.start('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException by non-participant', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ opponent_id: 'user-2' }))

      await expect(service.start('debate-uuid-1', 'user-99')).rejects.toThrow(ForbiddenException)
    })
  })

  describe('complete', () => {
    it('sets status=completed and completed_at', async () => {
      const debate = createMockDebate({ status: 'active', opponent_id: 'user-2' })
      debateRepo.findOneBy.mockResolvedValue(debate)
      debateRepo.save.mockResolvedValue({ ...debate, status: 'completed' })

      const result = await service.complete('debate-uuid-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('completed')
      expect(result.data.completed_at).toBeDefined()
    })

    it('throws BadRequestException for non-active debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate())

      await expect(service.complete('debate-uuid-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException for non-existent debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(null)

      await expect(service.complete('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException by non-participant', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ status: 'active', opponent_id: 'user-2' }))

      await expect(service.complete('debate-uuid-1', 'user-99')).rejects.toThrow(ForbiddenException)
    })
  })

  describe('abandon', () => {
    it('sets status=abandoned by participant', async () => {
      const debate = createMockDebate()
      debateRepo.findOneBy.mockResolvedValue(debate)
      debateRepo.save.mockResolvedValue({ ...debate, status: 'abandoned' })

      const result = await service.abandon('debate-uuid-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('abandoned')
    })

    it('throws ForbiddenException by non-participant', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate())

      await expect(service.abandon('debate-uuid-1', 'user-99')).rejects.toThrow(ForbiddenException)
    })

    it('throws BadRequestException for completed debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ status: 'completed', opponent_id: 'user-2' }))

      await expect(service.abandon('debate-uuid-1', 'user-1')).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException for non-existent debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(null)

      await expect(service.abandon('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('setScoringFailed', () => {
    it('updates status to scoring_failed', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ status: 'active', opponent_id: 'user-2' }))
      debateRepo.update.mockResolvedValue(undefined as any)

      await service.setScoringFailed('debate-uuid-1')

      expect(debateRepo.update).toHaveBeenCalledWith(
        { id: 'debate-uuid-1' },
        { status: 'scoring_failed' }
      )
    })

    it('throws NotFoundException for non-existent debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(null)

      await expect(service.setScoringFailed('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException for non-active debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate())

      await expect(service.setScoringFailed('debate-uuid-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('setWinner', () => {
    it('updates winner_id', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ status: 'completed', opponent_id: 'user-2' }))
      debateRepo.update.mockResolvedValue(undefined as any)

      await service.setWinner('debate-uuid-1', 'user-1')

      expect(debateRepo.update).toHaveBeenCalledWith(
        { id: 'debate-uuid-1' },
        { winner_id: 'user-1' }
      )
    })

    it('throws NotFoundException for non-existent debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(null)

      await expect(service.setWinner('nonexistent', 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException for non-active/completed debate', async () => {
      debateRepo.findOneBy.mockResolvedValue(createMockDebate())

      await expect(service.setWinner('debate-uuid-1', 'user-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAll', () => {
    it('returns paginated debates', async () => {
      debateRepo.findAndCount.mockResolvedValue([[createMockDebate()], 1])

      const result = await service.findAll(undefined, 1, 20)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.has_more).toBe(false)
    })

    it('filters by status', async () => {
      debateRepo.findAndCount.mockResolvedValue([[createMockDebate()], 1])

      await service.findAll('pending', 1, 20)

      expect(debateRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending' } })
      )
    })
  })

  describe('findOpen', () => {
    it('returns only pending debates', async () => {
      debateRepo.findAndCount.mockResolvedValue([[createMockDebate()], 1])

      const result = await service.findOpen(1, 20)

      expect(result.success).toBe(true)
      expect(debateRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'pending' } })
      )
    })
  })

  describe('auto-abandon timer', () => {
    beforeEach(() => jest.useFakeTimers())

    it('starts timer on create', async () => {
      const debate = createMockDebate()
      debateRepo.create.mockReturnValue(debate)
      debateRepo.save.mockResolvedValue(debate)

      await service.create('user-1', { topic_id: 'topic-uuid-1' })

      expect(service['pendingTimers'].has('debate-uuid-1')).toBe(true)
    })

    it('clears timer on join', async () => {
      const debate = createMockDebate()
      debateRepo.create.mockReturnValue(debate)
      debateRepo.save.mockResolvedValue(debate)
      await service.create('user-1', { topic_id: 'topic-uuid-1' })

      debateRepo.findOneBy.mockResolvedValue(createMockDebate())
      debateRepo.save.mockResolvedValue(createMockDebate({ opponent_id: 'user-2' }))
      await service.join('debate-uuid-1', 'user-2')

      expect(service['pendingTimers'].has('debate-uuid-1')).toBe(false)
    })

    it('abandons debate after timeout', async () => {
      const debate = createMockDebate()
      debateRepo.create.mockReturnValue(debate)
      debateRepo.save.mockResolvedValue(debate)
      await service.create('user-1', { topic_id: 'topic-uuid-1' })

      const abandonedDebate = createMockDebate({ status: 'abandoned' })
      debateRepo.findOneBy.mockResolvedValue(createMockDebate())
      debateRepo.save.mockResolvedValue(abandonedDebate)

      debateRepo.findOneBy.mockResolvedValue(createMockDebate())
      debateRepo.save.mockResolvedValue(undefined as any)

      jest.advanceTimersByTime(5 * 60 * 1000)

      expect(debateRepo.findOneBy).toHaveBeenCalled()
    })

    it('clears timer on start', async () => {
      const debate = createMockDebate({ opponent_id: 'user-2' })
      debateRepo.create.mockReturnValue(debate)
      debateRepo.save.mockResolvedValue(debate)
      await service.create('user-1', { topic_id: 'topic-uuid-1' })

      debateRepo.findOneBy.mockResolvedValue(createMockDebate({ opponent_id: 'user-2' }))
      debateRepo.save.mockResolvedValue(createMockDebate({ status: 'active', opponent_id: 'user-2' }))
      await service.start('debate-uuid-1', 'user-1')

      expect(service['pendingTimers'].has('debate-uuid-1')).toBe(false)
    })
  })
})
