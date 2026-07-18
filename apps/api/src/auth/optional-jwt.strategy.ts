import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class OptionalJwtStrategy extends PassportStrategy(Strategy, 'optional-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    })
  }

  async validate(payload: { sub: string; email: string } | null) {
    if (!payload) return null
    return { id: payload.sub, email: payload.email }
  }
}
