import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common'
import { VotesService } from './votes.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Get('debate/:debateId')
  async getByDebate(@Param('debateId') debateId: string) {
    return this.votesService.findByDebate(debateId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(@Request() req: any, @Body() body: any) {
    return this.votesService.submit(req.user.id, body)
  }
}
