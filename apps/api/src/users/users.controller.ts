import { Controller, Get, Param, Patch, Body, Query, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id)
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  async updateProfile(@Request() req: any, @Body() body: { display_name?: string; avatar_url?: string }) {
    return this.usersService.update(req.user.id, body)
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user debate stats' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User stats' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getStats(@Param('id') id: string) {
    return this.usersService.getStats(id)
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get user debate history' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Debate history' })
  async getHistory(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.getHistory(id, +page, +limit)
  }
}
