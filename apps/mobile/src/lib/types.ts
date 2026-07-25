import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Home: undefined
  Debates: undefined
  Profile: undefined
  Main: undefined
  CreateDebate: undefined
  DebateLobby: { debateId: string; side?: string }
  DebateRound: { debateId: string; roundNumber: number; side: 'creator' | 'opponent' }
  GuestDebate: undefined
  Scoring: { debateId: string }
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
