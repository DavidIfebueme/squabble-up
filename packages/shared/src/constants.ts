import type { DebateStatus } from './types'

export const DEBATE_STATUSES: Record<DebateStatus, DebateStatus> = {
  pending: 'pending',
  active: 'active',
  completed: 'completed',
  abandoned: 'abandoned',
  scoring_failed: 'scoring_failed',
}

export const COMMUNITY_WEIGHT = 0.6
export const AI_WEIGHT = 0.4
export const MAX_SCORING_TIME_MS = 10000
export const GUEST_SESSION_TTL_HOURS = 24
export const AUDIO_RETENTION_DAYS = 30
export const OFFLINE_RECONNECT_WINDOW_SECONDS = 120
export const DEEP_LINK_SCHEME = 'squabbleup'
export const DEFAULT_ELO = 1000
export const K_FACTOR = 32
export const DEBATE_ROUNDS = 3

export const SCORING_RETRY_CONFIG = {
  auto_retries: 1,
  manual_retries: 3,
}
