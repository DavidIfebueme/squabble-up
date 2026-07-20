export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  elo_score: number | null
  verified: boolean
  auth_provider: 'google' | 'email'
  created_at: string
  updated_at: string
}

export type DebateStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'abandoned'
  | 'scoring_failed'

export interface Debate {
  id: string
  topic_id: string
  creator_id: string | null
  opponent_id: string | null
  status: DebateStatus
  winner_id: string | null
  created_at: string
  completed_at: string | null
}

export type RoundNumber = 1 | 2 | 3

export type RoundType = 'opening' | 'rebuttal' | 'closing'

export interface Round {
  id: string
  debate_id: string
  round_number: RoundNumber
  speaker_id: string
  audio_url: string | null
  transcription: string | null
  duration: number | null
  created_at: string
}

export type VoteType = 'creator' | 'opponent'

export interface Vote {
  id: string
  debate_id: string
  voter_id: string
  vote_type: VoteType
  logic_score: number
  evidence_score: number
  delivery_score: number
  created_at: string
}

export interface Comment {
  id: string
  debate_id: string
  user_id: string
  content: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  title: string
  slug: string
  description: string
  category: string
  created_by: string | null
  debate_count: number
  created_at: string
}

export interface GuestSession {
  id: string
  session_token: string
  debate_id: string
  participant_role: 'creator' | 'opponent'
  expires_at: string
  created_at: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  page: number
  limit: number
  total: number
  has_more: boolean
}

export interface ScoringResult {
  logic_score: number
  evidence_score: number
  delivery_score: number
  overall_score: number
  summary: string
}

export interface DebateRoomEvent {
  type: 'round_start' | 'round_end' | 'vote_submitted' | 'scoring_complete' | 'user_joined' | 'user_left'
  debate_id: string
  payload: Record<string, unknown>
  timestamp: string
}
