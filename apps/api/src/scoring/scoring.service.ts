import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { SCORING_QUEUE } from './scoring.module'

@Injectable()
export class ScoringService {
  constructor(@InjectQueue(SCORING_QUEUE) private readonly scoringQueue: Queue) {}

  async triggerScoring(debateId: string) {
    const job = await this.scoringQueue.add('score-debate', { debateId }, {
      attempts: 2,
    })
    return { job_id: job.id }
  }
}
