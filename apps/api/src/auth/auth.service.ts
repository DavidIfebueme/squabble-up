import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as admin from 'firebase-admin'
import { User } from '../users/user.entity'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async verifyGoogleToken(idToken: string) {
    const decoded = await admin.auth().verifyIdToken(idToken)
    let user = await this.userRepo.findOne({ where: { email: decoded.email } })

    if (!user) {
      user = this.userRepo.create({
        email: decoded.email!,
        display_name: decoded.name ?? decoded.email!.split('@')[0],
        auth_provider: 'google',
        verified: true,
        avatar_url: decoded.picture ?? null,
      })
      await this.userRepo.save(user)
    }

    return this.generateTokenResponse(user)
  }

  async register(email: string, password: string, display_name: string) {
    const existing = await this.userRepo.findOne({ where: { email } })
    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const firebaseUser = await admin.auth().createUser({ email, password, displayName: display_name })

    const user = this.userRepo.create({
      id: firebaseUser.uid,
      email,
      display_name,
      auth_provider: 'email',
      verified: false,
    })
    await this.userRepo.save(user)

    const verifyLink = await admin.auth().generateEmailVerificationLink(email)
    return { user: this.sanitizeUser(user), verify_link: verifyLink }
  }

  async login(email: string, _password: string) {
    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }
    return this.generateTokenResponse(user)
  }

  async verifyEmail(token: string) {
    const payload = this.jwtService.verify<{ uid: string }>(token)
    await this.userRepo.update({ id: payload.uid }, { verified: true })
    return { verified: true }
  }

  private generateTokenResponse(user: User) {
    const payload = { sub: user.id, email: user.email }
    return {
      access_token: this.jwtService.sign(payload),
      user: this.sanitizeUser(user),
    }
  }

  private sanitizeUser(user: User) {
    const { id, email, display_name, avatar_url, elo_score, verified, auth_provider } = user
    return { id, email, display_name, avatar_url, elo_score, verified, auth_provider }
  }
}
