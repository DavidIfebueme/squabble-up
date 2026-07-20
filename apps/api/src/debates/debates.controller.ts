import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger'
import { DebatesService } from './debates.service'
import { ScoringService } from '../scoring/scoring.service'
import { CreateDebateDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard'

@ApiTags('debates')
@Controller('debates')
export class DebatesController {
  constructor(
    private readonly debatesService: DebatesService,
    private readonly scoringService: ScoringService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List debates with optional status filter' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Paginated list of debates' })
  async list(@Query('status') status?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.debatesService.findAll(status, +page, +limit)
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
  async my(@Request() req: any, @Query('page') page = 1, @Query('limit') limit = 20) {
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
  async create(@Request() req: any, @Body() body: CreateDebateDto) {
    return this.debatesService.create(req.user?.id ?? null, body)
  }

  @Post(':id/join')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'Join an existing debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Joined debate' })
  @ApiResponse({ status: 400, description: 'Debate is full or not open' })
  async join(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.join(id, req.user?.id ?? null)
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start a debate (requires both participants)' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate started' })
  @ApiResponse({ status: 400, description: 'Missing participants or wrong state' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async start(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.start(id, req.user.id)
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete a debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate completed' })
  @ApiResponse({ status: 400, description: 'Debate is not active' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async complete(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.debatesService.complete(id, req.user.id)
  }

  @Post(':id/abandon')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Abandon a debate (participant only)' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Debate abandoned' })
  @ApiResponse({ status: 400, description: 'Wrong state' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  async abandon(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
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

  @Post(':id/score')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Trigger AI scoring for a debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Scoring triggered' })
  @ApiResponse({ status: 400, description: 'Debate not ready for scoring' })
  async score(@Param('id', ParseUUIDPipe) id: string) {
    return this.scoringService.triggerScoring(id)
  }
}
