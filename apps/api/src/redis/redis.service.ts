import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis
  private readonly logger = new Logger(RedisService.name)

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      retryStrategy: (times) => Math.min(times * 200, 3000),
      maxRetriesPerRequest: 3,
    })

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error', err)
    })
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds)
      } else {
        await this.client.set(key, value)
      }
    } catch (err) {
      this.logger.error(`Redis SET failed for key: ${key}`, err)
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key)
    } catch (err) {
      this.logger.error(`Redis GET failed for key: ${key}`, err)
      return null
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (err) {
      this.logger.error(`Redis DEL failed for key: ${key}`, err)
    }
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    try {
      await this.client.sadd(key, ...members)
    } catch (err) {
      this.logger.error(`Redis SADD failed for key: ${key}`, err)
    }
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    try {
      await this.client.srem(key, ...members)
    } catch (err) {
      this.logger.error(`Redis SREM failed for key: ${key}`, err)
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key)
    } catch (err) {
      this.logger.error(`Redis SMEMBERS failed for key: ${key}`, err)
      return []
    }
  }

  async onModuleDestroy() {
    await this.client.quit()
  }
}
