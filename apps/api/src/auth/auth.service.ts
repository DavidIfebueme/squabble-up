import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { User } from '../users/user.entity'
import { EmailService } from '../email/email.service'
import { RedisService } from '../redis/redis.service'

const SALT_ROUNDS = 12

interface GooglePayload {
  sub: string
  email: string
  name: string
  picture: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  async register(email: string, password: string, display_name: string) {
    const existing = await this.userRepo.findOne({ where: { email } })
    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)

    const user = this.userRepo.create({
      email,
      password_hash,
      display_name,
      auth_provider: 'email',
      verified: false,
    })
    await this.userRepo.save(user)

    const verifyToken = this.jwtService.sign(
      { uid: user.id, purpose: 'email_verification' },
      { expiresIn: '24h' },
    )
    await this.emailService.sendVerificationEmail(email, verifyToken)

    return { user: this.sanitizeUser(user) }
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (user.auth_provider !== 'email') {
      throw new UnauthorizedException('Use social login for this account')
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.generateTokenResponse(user)
  }

  async googleAuth(payload: GooglePayload) {
    let user = await this.userRepo.findOne({ where: { email: payload.email } })

    if (user) {
      if (user.auth_provider === 'email') {
        user.auth_provider = 'google'
        user.verified = true
        user.password_hash = null
        await this.userRepo.save(user)
      }
    } else {
      user = this.userRepo.create({
        email: payload.email,
        display_name: payload.name ?? payload.email.split('@')[0],
        avatar_url: payload.picture ?? null,
        auth_provider: 'google',
        verified: true,
      })
      await this.userRepo.save(user)
    }

    return this.generateTokenResponse(user)
  }

  async refresh(refreshToken: string) {
    const userId = await this.redisService.get(`refresh_token:${refreshToken}`)
    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    let payload: { sub: string; email: string }
    try {
      payload = this.jwtService.verify(refreshToken)
    } catch {
      await this.removeRefreshToken(refreshToken, userId)
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (payload.sub !== userId) {
      await this.removeRefreshToken(refreshToken, userId)
      throw new UnauthorizedException('Invalid refresh token')
    }

    const user = await this.userRepo.findOne({ where: { id: userId } })
    if (!user) {
      await this.removeRefreshToken(refreshToken, userId)
      throw new UnauthorizedException('Invalid refresh token')
    }

    await this.removeRefreshToken(refreshToken, userId)

    const newTokens = await this.generateTokenResponse(user)
    return { access_token: newTokens.access_token, refresh_token: newTokens.refresh_token }
  }

  async logout(userId: string, refreshToken: string) {
    await this.removeRefreshToken(refreshToken, userId)
  }

  async verifyEmail(token: string) {
    let payload: { uid: string; purpose: string }
    try {
      payload = this.jwtService.verify(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token')
    }

    if (payload.purpose !== 'email_verification') {
      throw new UnauthorizedException('Invalid token purpose')
    }

    await this.userRepo.update({ id: payload.uid }, { verified: true })
    return { verified: true }
  }

  private async generateTokenResponse(user: User) {
    const payload = { sub: user.id, email: user.email }

    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' })
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '30d' })

    await this.redisService.set(`refresh_token:${refresh_token}`, user.id, 30 * 24 * 60 * 60)
    await this.redisService.sadd(`user_refresh_tokens:${user.id}`, refresh_token)

    return {
      access_token,
      refresh_token,
      user: this.sanitizeUser(user),
    }
  }

  private async removeRefreshToken(refreshToken: string, userId: string) {
    await this.redisService.del(`refresh_token:${refreshToken}`)
    await this.redisService.srem(`user_refresh_tokens:${userId}`, refreshToken)
  }

  private sanitizeUser(user: User) {
    const { id, email, display_name, avatar_url, elo_score, verified, auth_provider } = user
    return { id, email, display_name, avatar_url, elo_score, verified, auth_provider }
  }
}
