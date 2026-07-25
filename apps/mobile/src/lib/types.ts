import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Home: undefined
  Debates: undefined
  Profile: undefined
  Main: undefined
  CreateDebate: { guestName?: string } | undefined
  DebateLobby: { debateId: string; side?: string }
  DebateRound: { debateId: string; roundNumber: number; side: 'creator' | 'opponent' }
  GuestDebate: undefined
  Scoring: { debateId: string }
  Voting: { debateId: string }
  TopicDetail: { slug: string }
  Auth: undefined
}

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>

export interface DebateEvent {
  debate_id: string
  timestamp: string
  payload?: Record<string, unknown>
  user_id?: string
  remaining_ms?: number
  reason?: string
}

export interface Vote {
  id: string
  debate_id: string
  voter_id: string
  vote_type: 'creator' | 'opponent'
  logic_score: number
  evidence_score: number
  delivery_score: number
  created_at: string
}
