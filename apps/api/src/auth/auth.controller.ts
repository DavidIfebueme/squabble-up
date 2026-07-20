import { Controller, Post, Body, HttpCode, HttpStatus, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'

interface CookieRequest extends Request {
  cookies: Record<string, string>
  user?: { id: string }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; display_name: string }) {
    return this.authService.register(body.email, body.password, body.display_name)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password)
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })
    return { access_token: result.access_token, user: result.user }
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(
    @Body() body: { sub: string; email: string; name?: string; picture?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleAuth(body)
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    })
    return { access_token: result.access_token, user: result.user }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: CookieRequest) {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      return { access_token: null }
    }
    return this.authService.refresh(refreshToken)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: CookieRequest, @Res({ passthrough: true }) res: Response) {
    const userId = req.user?.id
    if (userId) {
      await this.authService.logout(userId)
    }
    res.clearCookie('refresh_token', { path: '/api/v1/auth' })
    return { success: true }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token)
  }
}
