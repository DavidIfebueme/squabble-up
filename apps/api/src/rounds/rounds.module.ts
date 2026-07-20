import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoundsController } from './rounds.controller'
import { RoundsService } from './rounds.service'
import { Round } from './round.entity'
import { DebatesModule } from '../debates/debates.module'

@Module({
  imports: [TypeOrmModule.forFeature([Round]), DebatesModule],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
