import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, IsNull } from 'typeorm'
import { Comment } from './comment.entity'

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async findByDebate(debateId: string) {
    const comments = await this.commentRepo.find({
      where: { debate_id: debateId, deleted_at: IsNull() },
      order: { created_at: 'ASC' },
    })
    return { success: true, data: comments }
  }

  async create(userId: string, data: Pick<Comment, 'debate_id' | 'content'>) {
    const comment = this.commentRepo.create({ ...data, user_id: userId })
    await this.commentRepo.save(comment)
    return { success: true, data: comment }
  }

  async softDelete(id: string) {
    const comment = await this.commentRepo.findOneBy({ id })
    if (!comment) throw new NotFoundException('Comment not found')
    comment.deleted_at = new Date()
    await this.commentRepo.save(comment)
    return { success: true }
  }
}
