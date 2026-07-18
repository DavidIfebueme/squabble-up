import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common'
import { DebatesService } from './debates.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard'

@Controller('debates')
export class DebatesController {
  constructor(private readonly debatesService: DebatesService) {}

  @Get()
  async list(@Query('status') status?: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.debatesService.findAll(status, +page, +limit)
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.debatesService.findById(id)
  }

  @Post()
  @UseGuards(OptionalAuthGuard)
  async create(@Request() req: any, @Body() body: { topic_id: string; participant_role?: 'creator' | 'opponent' }) {
    return this.debatesService.create(req.user?.id ?? null, body)
  }

  @Post(':id/join')
  @UseGuards(OptionalAuthGuard)
  async join(@Request() req: any, @Param('id') id: string) {
    return this.debatesService.join(id, req.user?.id ?? null)
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async start(@Param('id') id: string) {
    return this.debatesService.start(id)
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  async complete(@Param('id') id: string) {
    return this.debatesService.complete(id)
  }
}
