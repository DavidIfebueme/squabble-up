import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { User } from './user.entity'
import { Debate } from '../debates/debate.entity'
import { Round } from '../rounds/round.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, Debate, Round])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
