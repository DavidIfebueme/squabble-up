import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { HttpModule } from '@nestjs/axios'
import { ScoringService } from './scoring.service'
import { ScoringProcessor } from './scoring.processor'
import { GeminiService } from './gemini.service'
import { VotesModule } from '../votes/votes.module'
import { DebatesModule } from '../debates/debates.module'
import { UsersModule } from '../users/users.module'
import { RoundsModule } from '../rounds/rounds.module'
import { TopicsModule } from '../topics/topics.module'

export const SCORING_QUEUE = 'scoring'

@Module({
  imports: [
    BullModule.registerQueue({ name: SCORING_QUEUE }),
    HttpModule,
    VotesModule,
    DebatesModule,
    UsersModule,
    RoundsModule,
    TopicsModule,
  ],
  providers: [ScoringService, ScoringProcessor, GeminiService],
  exports: [ScoringService],
})
export class ScoringModule {}
