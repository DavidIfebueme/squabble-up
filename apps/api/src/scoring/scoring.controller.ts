import { Controller, Post, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { ScoringService } from './scoring.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('scoring')
@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post('debate/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Trigger AI scoring for a debate' })
  @ApiParam({ name: 'id', description: 'Debate UUID' })
  @ApiResponse({ status: 200, description: 'Scoring triggered' })
  @ApiResponse({ status: 400, description: 'Debate not ready for scoring' })
  async trigger(@Param('id', ParseUUIDPipe) id: string) {
    return this.scoringService.triggerScoring(id)
  }
}
