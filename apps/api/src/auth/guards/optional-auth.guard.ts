import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class OptionalAuthGuard extends AuthGuard('optional-jwt') {
  handleRequest<TUser = { id: string; email: string } | null>(
    err: Error | null,
    user: TUser,
  ): TUser {
    return user ?? (null as TUser)
  }
}
