import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { TopicsService } from './topics.service'
import { Topic } from './topic.entity'
import { Subtopic } from './subtopic.entity'
import { Repository } from 'typeorm'

describe('TopicsService', () => {
  let service: TopicsService
  let topicRepo: jest.Mocked<Repository<Topic>>
  let subtopicRepo: jest.Mocked<Repository<Subtopic>>

  const mockTopic: Topic = {
    id: 'topic-uuid-1',
    title: 'Climate Change',
    slug: 'climate-change',
    description: 'Debates about climate policy',
    category: 'science',
    created_by: null,
    debate_count: 0,
    created_at: new Date(),
  }

  const mockSubtopic: Subtopic = {
    id: 'sub-uuid-1',
    name: 'Carbon Tax',
    slug: 'carbon-tax',
    topic_id: 'topic-uuid-1',
    created_at: new Date(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        {
          provide: getRepositoryToken(Topic),
          useValue: {
            findAndCount: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            increment: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subtopic),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get(TopicsService)
    topicRepo = module.get(getRepositoryToken(Topic))
    subtopicRepo = module.get(getRepositoryToken(Subtopic))
  })

  afterEach(() => jest.clearAllMocks())

  describe('findAll', () => {
    it('returns paginated topics', async () => {
      topicRepo.findAndCount.mockResolvedValue([[mockTopic], 1])

      const result = await service.findAll(undefined, 1, 20)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.has_more).toBe(false)
    })

    it('filters by category', async () => {
      topicRepo.findAndCount.mockResolvedValue([[mockTopic], 1])

      await service.findAll('science', 1, 20)

      expect(topicRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'science' } })
      )
    })

    it('returns has_more when more pages exist', async () => {
      topicRepo.findAndCount.mockResolvedValue([[mockTopic], 50])

      const result = await service.findAll(undefined, 1, 20)

      expect(result.has_more).toBe(true)
    })
  })

  describe('findBySlug', () => {
    it('returns topic by slug', async () => {
      topicRepo.findOneBy.mockResolvedValue(mockTopic)

      const result = await service.findBySlug('climate-change')

      expect(result.success).toBe(true)
      expect(result.data.slug).toBe('climate-change')
    })

    it('throws NotFoundException for missing slug', async () => {
      topicRepo.findOneBy.mockResolvedValue(null)

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('findById', () => {
    it('returns topic by id', async () => {
      topicRepo.findOneBy.mockResolvedValue(mockTopic)

      const result = await service.findById('topic-uuid-1')

      expect(result.success).toBe(true)
      expect(result.data.id).toBe('topic-uuid-1')
    })

    it('throws NotFoundException for missing id', async () => {
      topicRepo.findOneBy.mockResolvedValue(null)

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    it('creates topic with auto-generated slug', async () => {
      topicRepo.findOneBy.mockResolvedValue(null)
      topicRepo.create.mockReturnValue(mockTopic)
      topicRepo.save.mockResolvedValue(mockTopic)

      const result = await service.create({
        title: 'Climate Change',
        description: 'Debates about climate policy',
        category: 'science',
      })

      expect(result.success).toBe(true)
      expect(topicRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'climate-change' })
      )
    })

    it('throws ConflictException for duplicate slug', async () => {
      topicRepo.findOneBy.mockResolvedValue(mockTopic)

      await expect(
        service.create({
          title: 'Climate Change',
          description: 'Another description',
          category: 'science',
        })
      ).rejects.toThrow(ConflictException)
    })

    it('generates slug from title with special characters', async () => {
      topicRepo.findOneBy.mockResolvedValue(null)
      topicRepo.create.mockReturnValue({ ...mockTopic, slug: 'ai-ethics' })
      topicRepo.save.mockResolvedValue(mockTopic)

      await service.create({
        title: 'AI & Ethics!',
        description: 'Debates about AI',
        category: 'tech',
      })

      expect(topicRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'ai-ethics' })
      )
    })
  })

  describe('findSubtopicsByTopicId', () => {
    it('returns subtopics for a topic', async () => {
      subtopicRepo.find.mockResolvedValue([mockSubtopic])

      const result = await service.findSubtopicsByTopicId('topic-uuid-1')

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
    })

    it('returns empty array when no subtopics exist', async () => {
      subtopicRepo.find.mockResolvedValue([])

      const result = await service.findSubtopicsByTopicId('topic-uuid-1')

      expect(result.data).toHaveLength(0)
    })
  })

  describe('createSubtopic', () => {
    it('creates subtopic with auto-generated slug', async () => {
      topicRepo.findOneBy.mockResolvedValue(mockTopic)
      subtopicRepo.findOneBy.mockResolvedValue(null)
      subtopicRepo.create.mockReturnValue(mockSubtopic)
      subtopicRepo.save.mockResolvedValue(mockSubtopic)

      const result = await service.createSubtopic('topic-uuid-1', { name: 'Carbon Tax' })

      expect(result.success).toBe(true)
      expect(subtopicRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'carbon-tax', topic_id: 'topic-uuid-1' })
      )
    })

    it('throws NotFoundException when topic does not exist', async () => {
      topicRepo.findOneBy.mockResolvedValue(null)

      await expect(
        service.createSubtopic('nonexistent', { name: 'Carbon Tax' })
      ).rejects.toThrow(NotFoundException)
    })

    it('throws ConflictException for duplicate slug within same topic', async () => {
      topicRepo.findOneBy.mockResolvedValue(mockTopic)
      subtopicRepo.findOneBy.mockResolvedValue(mockSubtopic)

      await expect(
        service.createSubtopic('topic-uuid-1', { name: 'Carbon Tax' })
      ).rejects.toThrow(ConflictException)
    })

    it('allows same subtopic name under different topics', async () => {
      topicRepo.findOneBy.mockResolvedValue(mockTopic)
      subtopicRepo.findOneBy.mockResolvedValue(null)
      subtopicRepo.create.mockReturnValue(mockSubtopic)
      subtopicRepo.save.mockResolvedValue(mockSubtopic)

      const result = await service.createSubtopic('topic-uuid-2', { name: 'Carbon Tax' })

      expect(result.success).toBe(true)
      expect(subtopicRepo.findOneBy).toHaveBeenCalledWith({ slug: 'carbon-tax', topic_id: 'topic-uuid-2' })
    })
  })

  describe('incrementDebateCount', () => {
    it('increments debate count', async () => {
      topicRepo.increment.mockResolvedValue(undefined as any)

      await service.incrementDebateCount('topic-uuid-1')

      expect(topicRepo.increment).toHaveBeenCalledWith({ id: 'topic-uuid-1' }, 'debate_count', 1)
    })
  })
})
