import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class OptionalAuthGuard extends AuthGuard('optional-jwt') {
  handleRequest(err: any, user: any) {
    return user ?? null
  }
}
