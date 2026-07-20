import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { RoundsService } from './rounds.service'
import { CreateRoundDto, UpdateRoundDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

interface AuthenticatedRequest {
  user: { id: string }
}

@ApiTags('rounds')
@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('debate/:debateId')
  @ApiOperation({ summary: 'Get rounds for a debate' })
  @ApiParam({ name: 'debateId', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Rounds ordered by round_number' })
  async getByDebate(@Param('debateId', ParseUUIDPipe) debateId: string) {
    return this.roundsService.findByDebate(debateId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a round' })
  @ApiResponse({ status: 201, description: 'Round created' })
  @ApiResponse({ status: 400, description: 'Invalid round_number or duplicate' })
  @ApiResponse({ status: 403, description: 'Not a debate participant' })
  async create(@Request() req: AuthenticatedRequest, @Body() body: CreateRoundDto) {
    return this.roundsService.create(req.user.id, body)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a round (transcription, duration)' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({ status: 200, description: 'Round updated' })
  @ApiResponse({ status: 403, description: 'Not the round speaker' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  async update(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateRoundDto) {
    return this.roundsService.updateRound(id, req.user.id, body)
  }
}
