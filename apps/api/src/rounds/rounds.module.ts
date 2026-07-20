import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoundsController } from './rounds.controller'
import { RoundsService } from './rounds.service'
import { Round } from './round.entity'
import { DebatesModule } from '../debates/debates.module'
import { RealtimeModule } from '../realtime/realtime.module'

@Module({
  imports: [TypeOrmModule.forFeature([Round]), DebatesModule, RealtimeModule],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
