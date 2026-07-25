import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException } from '@nestjs/common'
import { UsersService } from './users.service'
import { User } from './user.entity'
import { Debate } from '../debates/debate.entity'
import { Round } from '../rounds/round.entity'
import { Repository } from 'typeorm'

describe('UsersService', () => {
  let service: UsersService
  let userRepo: jest.Mocked<Repository<User>>
  let debateRepo: jest.Mocked<Repository<Debate>>

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'user-1',
    email: 'test@example.com',
    password_hash: null,
    display_name: 'Test User',
    avatar_url: null,
    elo_score: 1200,
    verified: true,
    auth_provider: 'email',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  })

  const createMockDebate = (overrides?: Partial<Debate>): Debate => ({
    id: 'debate-1',
    topic_id: 'topic-1',
    creator_id: 'user-1',
    opponent_id: 'user-2',
    status: 'completed',
    winner_id: 'user-1',
    created_at: new Date(),
    completed_at: new Date(),
    ai_scores: null,
    community_voting: false,
    ...overrides,
  })

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Debate),
          useValue: {
            count: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Round),
          useValue: {},
        },
      ],
    }).compile()

    service = module.get(UsersService)
    userRepo = module.get(getRepositoryToken(User))
    debateRepo = module.get(getRepositoryToken(Debate))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('findById', () => {
    it('returns user without email', async () => {
      userRepo.findOne.mockResolvedValue(createMockUser())

      const result = await service.findById('user-1')

      expect(result).not.toHaveProperty('email')
      expect(result).toHaveProperty('display_name', 'Test User')
    })

    it('throws NotFoundException for non-existent user', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('updates display_name', async () => {
      userRepo.findOne.mockResolvedValue(createMockUser({ display_name: 'New Name' }))
      userRepo.update.mockResolvedValue(undefined as never)

      const result = await service.update('user-1', { display_name: 'New Name' })

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { display_name: 'New Name' })
      expect(result).toHaveProperty('display_name', 'New Name')
    })

    it('updates avatar_url', async () => {
      userRepo.findOne.mockResolvedValue(createMockUser({ avatar_url: 'https://example.com/avatar.png' }))
      userRepo.update.mockResolvedValue(undefined as never)

      const result = await service.update('user-1', { avatar_url: 'https://example.com/avatar.png' })

      expect(userRepo.update).toHaveBeenCalledWith('user-1', { avatar_url: 'https://example.com/avatar.png' })
      expect(result).toHaveProperty('avatar_url', 'https://example.com/avatar.png')
    })
  })

  describe('getStats', () => {
    it('returns correct debate count, wins, losses, win rate', async () => {
      userRepo.findOne.mockResolvedValue(createMockUser())
      debateRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(6)

      const result = await service.getStats('user-1')

      expect(result.success).toBe(true)
      expect(result.data.total_debates).toBe(10)
      expect(result.data.wins).toBe(6)
      expect(result.data.losses).toBe(4)
      expect(result.data.win_rate).toBe(60)
    })

    it('returns zeros when no debates', async () => {
      userRepo.findOne.mockResolvedValue(createMockUser())
      debateRepo.count.mockResolvedValue(0)

      const result = await service.getStats('user-1')

      expect(result.data.total_debates).toBe(0)
      expect(result.data.wins).toBe(0)
      expect(result.data.losses).toBe(0)
      expect(result.data.win_rate).toBe(0)
    })

    it('throws NotFoundException for non-existent user', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.getStats('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getHistory', () => {
    it('returns debates with result (won/lost/tied)', async () => {
      const mockDebates = [
        createMockDebate({ id: 'debate-1', winner_id: 'user-1' }),
        createMockDebate({ id: 'debate-2', winner_id: 'user-2' }),
        createMockDebate({ id: 'debate-3', winner_id: null }),
      ]

      const mockQb = debateRepo.createQueryBuilder()
      ;(mockQb.getManyAndCount as jest.Mock).mockResolvedValue([mockDebates, 3])

      const result = await service.getHistory('user-1')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(3)
      expect(result.data[0].result).toBe('won')
      expect(result.data[1].result).toBe('lost')
      expect(result.data[2].result).toBe('tied')
    })

    it('returns paginated results', async () => {
      const mockQb = debateRepo.createQueryBuilder()
      ;(mockQb.getManyAndCount as jest.Mock).mockResolvedValue([[], 25])

      const result = await service.getHistory('user-1', 2, 10)

      expect(result.success).toBe(true)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
      expect(result.total).toBe(25)
      expect(result.has_more).toBe(true)
    })
  })

  describe('updateElo', () => {
    it('calculates elo correctly after win', async () => {
      const winner = createMockUser({ id: 'winner', elo_score: 1200 })
      const loser = createMockUser({ id: 'loser', elo_score: 1200 })
      userRepo.findOneBy.mockResolvedValueOnce(winner).mockResolvedValueOnce(loser)
      userRepo.save.mockResolvedValue([winner, loser] as never)

      await service.updateElo('winner', 'loser')

      expect(userRepo.save).toHaveBeenCalled()
      expect(winner.elo_score).toBeGreaterThan(1200)
      expect(loser.elo_score).toBeLessThan(1200)
    })

    it('does not update when user not found', async () => {
      userRepo.findOneBy.mockResolvedValue(null)

      await service.updateElo('winner', 'loser')

      expect(userRepo.save).not.toHaveBeenCalled()
    })
  })
})
