import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { TopicsService } from './topics.service'

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  async list(@Query('category') category?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.topicsService.findAll(category, +page, +limit)
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.topicsService.findById(id)
  }

  @Post()
  async create(@Body() body: { title: string; description: string; category: string }) {
    return this.topicsService.create(body)
  }
}
