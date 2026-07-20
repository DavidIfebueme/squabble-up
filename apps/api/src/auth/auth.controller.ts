import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { RegisterDto, LoginDto, GoogleAuthDto } from './dto'
import { OptionalAuthGuard } from './guards/optional-auth.guard'

interface CookieRequest extends Request {
  cookies: Record<string, string>
  user?: { id: string }
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const result = await this.authService.register(body.email, body.password, body.display_name)
    return {
      user: result.user,
      message: 'Verification email sent',
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password)
    res.cookie('refresh_token', result.refresh_token, REFRESH_COOKIE_OPTIONS)
    return { access_token: result.access_token, user: result.user }
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() body: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleAuth(body)
    res.cookie('refresh_token', result.refresh_token, REFRESH_COOKIE_OPTIONS)
    return { access_token: result.access_token, user: result.user }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: CookieRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token')
    }
    const result = await this.authService.refresh(refreshToken)
    res.cookie('refresh_token', result.refresh_token, REFRESH_COOKIE_OPTIONS)
    return { access_token: result.access_token }
  }

  @Post('logout')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: CookieRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token
    if (req.user?.id && refreshToken) {
      await this.authService.logout(req.user.id, refreshToken)
    }
    res.clearCookie('refresh_token', { path: '/api/v1/auth' })
    return { success: true }
  }

  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token)
  }
}
