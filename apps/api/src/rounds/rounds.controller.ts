import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { RoundsService } from './rounds.service'

@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('debate/:debateId')
  async getByDebate(@Param('debateId') debateId: string) {
    return this.roundsService.findByDebate(debateId)
  }

  @Post()
  async create(@Body() body: { debate_id: string; round_number: number; speaker_id: string }) {
    return this.roundsService.create(body)
  }
}
