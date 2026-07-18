import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import { DEFAULT_ELO, K_FACTOR } from '@squabble-up/shared'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
