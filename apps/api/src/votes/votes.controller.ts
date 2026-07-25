import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { VotesService } from './votes.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthRequest } from '../common/types/auth-request'
import type { Vote } from './vote.entity'

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get('debate/:debateId')
  async getByDebate(@Param('debateId') debateId: string) {
    return this.votesService.findByDebate(debateId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(
    @Request() req: AuthRequest,
    @Body() body: Pick<Vote, 'debate_id' | 'vote_type' | 'logic_score' | 'evidence_score' | 'delivery_score'>
  ) {
    return this.votesService.submit(req.user.id, body)
  }
}
