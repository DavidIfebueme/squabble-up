import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Home: undefined
  Debates: undefined
  Profile: undefined
  Main: undefined
  Splash: undefined
  OnboardingWelcome: undefined
  OnboardingInterests: undefined
  OnboardingPersona: { interests?: string[] } | undefined
  Auth: { displayName?: string } | undefined
  EmailVerification: { email: string }
  ForgotPassword: undefined
  CreateDebate: { guestName?: string; preselectedTopicId?: string } | undefined
  DebateLobby: { debateId: string; side?: string }
  PreDebate: { debateId: string; side: 'creator' | 'opponent' }
  DebateRound: { debateId: string; roundNumber: number; side: 'creator' | 'opponent' }
  BetweenRound: { debateId: string; roundNumber: number; side: 'creator' | 'opponent' }
  GuestDebate: undefined
  Scoring: { debateId: string }
  Verdict: { debateId: string }
  Voting: { debateId: string }
  TopicDetail: { slug: string }
  SearchTopics: undefined
  TopicSuggestion: { query?: string } | undefined
  EditProfile: { user?: { display_name?: string; email?: string; avatar_url?: string | null } } | undefined
  DebateHistory: { userId: string }
  Notifications: undefined
  Settings: { email?: string } | undefined
  CommunityGuidelines: undefined
  Report: { type?: 'debate' | 'comment' | 'problem'; targetId?: string } | undefined
  BlockUser: { username: string }
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
