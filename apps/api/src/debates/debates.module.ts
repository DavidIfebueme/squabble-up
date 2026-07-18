import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DebatesController } from './debates.controller'
import { DebatesService } from './debates.service'
import { Debate } from './debate.entity'
import { GuestSession } from './guest-session.entity'
import { TopicsModule } from '../topics/topics.module'

@Module({
  imports: [TypeOrmModule.forFeature([Debate, GuestSession]), TopicsModule],
  controllers: [DebatesController],
  providers: [DebatesService],
  exports: [DebatesService],
})
export class DebatesModule {}
