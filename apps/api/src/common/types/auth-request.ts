import type { Request } from 'express'

export interface AuthRequest extends Request {
  user: { id: string; email: string }
}

export interface OptionalAuthRequest extends Request {
  user?: { id: string; email: string }
}
