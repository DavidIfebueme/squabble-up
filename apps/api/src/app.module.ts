import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bullmq'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { DebatesModule } from './debates/debates.module'
import { RoundsModule } from './rounds/rounds.module'
import { VotesModule } from './votes/votes.module'
import { ScoringModule } from './scoring/scoring.module'
import { TopicsModule } from './topics/topics.module'
import { CommentsModule } from './comments/comments.module'
import { RealtimeModule } from './realtime/realtime.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('REDIS_URL') },
      }),
    }),
    AuthModule,
    UsersModule,
    DebatesModule,
    RoundsModule,
    VotesModule,
    ScoringModule,
    TopicsModule,
    CommentsModule,
    RealtimeModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
