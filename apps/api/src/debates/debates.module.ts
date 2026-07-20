import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DebatesController } from './debates.controller'
import { DebatesService } from './debates.service'
import { Debate } from './debate.entity'
import { GuestSession } from './guest-session.entity'
import { TopicsModule } from '../topics/topics.module'
import { RealtimeModule } from '../realtime/realtime.module'
import { ScoringModule } from '../scoring/scoring.module'

@Module({
  imports: [TypeOrmModule.forFeature([Debate, GuestSession]), TopicsModule, RealtimeModule, ScoringModule],
  controllers: [DebatesController],
  providers: [DebatesService],
  exports: [DebatesService],
})
export class DebatesModule {}
