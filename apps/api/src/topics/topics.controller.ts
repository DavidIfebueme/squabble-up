import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger'
import { TopicsService } from './topics.service'
import { CreateTopicDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'List topics with optional category filter' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Paginated list of topics' })
  async list(@Query('category') category?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.topicsService.findAll(category, +page, +limit)
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get topic by ID (UUID) or slug' })
  @ApiParam({ name: 'identifier', description: 'Topic UUID or slug' })
  @ApiResponse({ status: 200, description: 'Topic found' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async get(@Param('identifier') identifier: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    return isUuid
      ? this.topicsService.findById(identifier)
      : this.topicsService.findBySlug(identifier)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new topic' })
  @ApiResponse({ status: 201, description: 'Topic created' })
  @ApiResponse({ status: 409, description: 'Topic with this title already exists' })
  async create(@Body() body: CreateTopicDto, @Req() req: any) {
    return this.topicsService.create({ ...body, created_by: req.user?.id })
  }
}
