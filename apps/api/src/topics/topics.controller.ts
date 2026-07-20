import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { TopicsService } from './topics.service'
import { CreateTopicDto, CreateSubtopicDto } from './dto'

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  async list(@Query('category') category?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.topicsService.findAll(category, +page, +limit)
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.topicsService.findBySlug(slug)
  }

  @Post()
  async create(@Body() body: CreateTopicDto) {
    return this.topicsService.create(body)
  }

  @Get(':topicId/subtopics')
  async listSubtopics(@Param('topicId') topicId: string) {
    return this.topicsService.findSubtopicsByTopicId(topicId)
  }

  @Post(':topicId/subtopics')
  async createSubtopic(@Param('topicId') topicId: string, @Body() body: CreateSubtopicDto) {
    return this.topicsService.createSubtopic(topicId, body)
  }
}
