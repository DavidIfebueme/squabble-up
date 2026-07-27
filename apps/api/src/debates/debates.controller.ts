import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger'
import { DebatesService } from './debates.service'
import { CreateDebateDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard'
import type { AuthRequest, OptionalAuthRequest } from '../common/types/auth-request'

@ApiTags('debates')
@Controller('debates')
export class DebatesController {
  constructor(
    private readonly debatesService: DebatesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List debates with optional filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'topic_id', required: false, description: 'Filter by topic UUID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Paginated list of debates' })
  async list(@Query('status') status?: string, @Query('topic_id') topicId?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.debatesService.findAll(status, topicId, +page, +limit)
  }

  @Get('open')
  @ApiOperation({ summary: 'List pending debates available to join' })
  @ApiResponse({ status: 200, description: 'Paginated list of open debates' })
  async open(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.debatesService.findOpen(+page, +limit)
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List current user's debates" })
  @ApiResponse({ status: 200, description: "Paginated list of user's debates" })
  async my(@Request() req: AuthRequest, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.debatesService.findMy(req.user.id, +page, +limit)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get debate by ID' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate found' })
  @ApiResponse({ status: 404, description: 'Debate not found' })
  async get(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.findById(id)
  }

  @Post()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Create a new debate' })
  @ApiResponse({ status: 201, description: 'Debate created' })
  async create(@Request() req: OptionalAuthRequest, @Body() body: CreateDebateDto) {
    return this.debatesService.create(req.user?.id ?? null, body)
  }

  @Post(':id/join')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Join an existing debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Joined debate' })
  @ApiResponse({ status: 400, description: 'Debate is full or not open' })
  async join(@Request() req: OptionalAuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.join(id, req.user?.id ?? null)
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start a debate (requires both participants)' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate started' })
  @ApiResponse({ status: 400, description: 'Missing participants or wrong state' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async start(@Request() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.start(id, req.user.id)
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete a debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate completed' })
  @ApiResponse({ status: 400, description: 'Debate is not active' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async complete(@Request() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.complete(id, req.user.id)
  }

  @Post(':id/abandon')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Abandon a debate (participant only)' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate abandoned' })
  @ApiResponse({ status: 400, description: 'Wrong state' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async abandon(@Request() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.abandon(id, req.user.id)
  }

  @Post(':id/heartbeat')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Send heartbeat to indicate presence' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Heartbeat acknowledged' })
  async heartbeat() {
    return { success: true, timestamp: new Date().toISOString() }
  }

  @Get(':id/scores')
  @ApiOperation({ summary: 'Get AI scores for a debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate scores' })
  @ApiResponse({ status: 404, description: 'Debate not found' })
  async getScores(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.getScores(id)
  }

  @Get(':id/scorecard')
  @ApiOperation({ summary: 'Get scorecard data for a debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Scorecard data' })
  @ApiResponse({ status: 404, description: 'Debate not found' })
  async scorecard(@Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.getScorecard(id)
  }
}
