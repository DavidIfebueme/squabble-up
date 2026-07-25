import { Controller, Get, Param, Patch, Body, UseGuards, Request } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthRequest } from '../common/types/auth-request'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: AuthRequest) {
    return this.usersService.findById(req.user.id)
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id)
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: AuthRequest, @Body() body: { display_name?: string; avatar_url?: string }) {
    return this.usersService.update(req.user.id, body)
  }
}
