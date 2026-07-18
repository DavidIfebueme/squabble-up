import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common'
import { CommentsService } from './comments.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('debate/:debateId')
  async getByDebate(@Param('debateId') debateId: string) {
    return this.commentsService.findByDebate(debateId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() body: { debate_id: string; content: string }) {
    return this.commentsService.create(req.user.id, body)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.commentsService.softDelete(id)
  }
}
