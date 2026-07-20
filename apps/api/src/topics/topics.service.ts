import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Topic } from './topic.entity'

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepo: Repository<Topic>,
  ) {}

  async findAll(category?: string, page = 1, limit = 20) {
    const where = category ? { category } : {}
    const [data, total] = await this.topicRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { debate_count: 'DESC' },
    })
    return {
      success: true,
      data,
      page,
      limit,
      total,
      has_more: page * limit < total,
    }
  }

  async findBySlug(slug: string) {
    const topic = await this.topicRepo.findOneBy({ slug })
    if (!topic) throw new NotFoundException('Topic not found')
    return { success: true, data: topic }
  }

  async findById(id: string) {
    const topic = await this.topicRepo.findOneBy({ id })
    if (!topic) throw new NotFoundException('Topic not found')
    return { success: true, data: topic }
  }

  async create(data: { title: string; description: string; category: string; created_by?: string }) {
    const slug = this.generateSlug(data.title)

    const existing = await this.topicRepo.findOneBy({ slug })
    if (existing) {
      throw new ConflictException('Topic with this title already exists')
    }

    const topic = this.topicRepo.create({ ...data, slug })
    await this.topicRepo.save(topic)
    return { success: true, data: topic }
  }

  async incrementDebateCount(topicId: string) {
    await this.topicRepo.increment({ id: topicId }, 'debate_count', 1)
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}
