import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ScoringService } from './scoring.service'
import { ScoringProcessor } from './scoring.processor'
import { VotesModule } from '../votes/votes.module'
import { DebatesModule } from '../debates/debates.module'
import { UsersModule } from '../users/users.module'

export const SCORING_QUEUE = 'scoring'

@Module({
  imports: [
    BullModule.registerQueue({ name: SCORING_QUEUE }),
    VotesModule,
    DebatesModule,
    UsersModule,
  ],
  providers: [ScoringService, ScoringProcessor],
  exports: [ScoringService],
})
export class ScoringModule {}
