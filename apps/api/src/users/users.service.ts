import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import { Debate } from '../debates/debate.entity'
import { Round } from '../rounds/round.entity'
import { DEFAULT_ELO, K_FACTOR } from '@squabble-up/shared'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Debate)
    private readonly debateRepo: Repository<Debate>,
    @InjectRepository(Round)
    private readonly roundRepo: Repository<Round>,
  ) {}

  async findById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException('User not found')
    const { email: _unused, ...safe } = user
    void _unused
    return safe
  }

  async update(id: string, data: Partial<Pick<User, 'display_name' | 'avatar_url'>>) {
    await this.userRepo.update(id, data)
    return this.findById(id)
  }

  async getStats(id: string) {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) throw new NotFoundException('User not found')

    const totalDebates = await this.debateRepo.count({
      where: [
        { creator_id: id, status: 'completed' as const },
        { opponent_id: id, status: 'completed' as const },
      ],
    })

    const wins = await this.debateRepo.count({
      where: { winner_id: id },
    })

    const winRate = totalDebates > 0 ? Math.round((wins / totalDebates) * 100) : 0

    return {
      success: true,
      data: {
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        elo_score: user.elo_score ?? DEFAULT_ELO,
        total_debates: totalDebates,
        wins,
        losses: totalDebates - wins,
        win_rate: winRate,
      },
    }
  }

  async getHistory(id: string, page = 1, limit = 20) {
    const qb = this.debateRepo.createQueryBuilder('debate')
      .leftJoinAndSelect('debate.topic_id', 'topicId')
      .where('(debate.creator_id = :id OR debate.opponent_id = :id) AND debate.status = :status', {
        id,
        status: 'completed',
      })
      .orderBy('debate.completed_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)

    const [debates, total] = await qb.getManyAndCount()

    const enriched = debates.map(d => ({
      id: d.id,
      topic_id: d.topic_id,
      status: d.status,
      winner_id: d.winner_id,
      result: d.winner_id === id ? 'won' : d.winner_id ? 'lost' : 'tied',
      completed_at: d.completed_at,
      is_creator: d.creator_id === id,
    }))

    return {
      success: true,
      data: enriched,
      page,
      limit,
      total,
      has_more: page * limit < total,
    }
  }

  async updateElo(winnerId: string, loserId: string) {
    const winner = await this.userRepo.findOneBy({ id: winnerId })
    const loser = await this.userRepo.findOneBy({ id: loserId })
    if (!winner || !loser) return

    const wElo = winner.elo_score ?? DEFAULT_ELO
    const lElo = loser.elo_score ?? DEFAULT_ELO

    const eW = 1 / (1 + Math.pow(10, (lElo - wElo) / 400))
    const eL = 1 - eW

    winner.elo_score = Math.round(wElo + K_FACTOR * (1 - eW))
    loser.elo_score = Math.round(lElo + K_FACTOR * (0 - eL))

    await this.userRepo.save([winner, loser])
  }
}
