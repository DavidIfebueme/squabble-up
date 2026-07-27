import api from './api'
import type { Debate, DebateScores, PaginatedResponse, Topic } from '@squabble-up/shared'

export async function getDebates(params?: { status?: string; topic_id?: string; page?: number; limit?: number }) {
  const { data } = await api.get<PaginatedResponse<Debate>>('/debates', { params })
  return data
}

export async function getOpenDebates(params?: { page?: number; limit?: number }) {
  const { data } = await api.get<PaginatedResponse<Debate>>('/debates/open', { params })
  return data
}

export async function getMyDebates(params?: { page?: number; limit?: number }) {
  const { data } = await api.get<PaginatedResponse<Debate>>('/debates/my', { params })
  return data
}

export async function getDebate(id: string) {
  const { data } = await api.get<{ success: boolean; data: Debate }>(`/debates/${id}`)
  return data
}

export async function createDebate(body: { topic_id: string; participant_role?: 'creator' | 'opponent'; community_voting?: boolean }) {
  const { data } = await api.post<{ success: boolean; data: { debate: Debate } }>('/debates', body)
  return data
}

export async function joinDebate(id: string) {
  const { data } = await api.post<{ success: boolean; data: { debate: Debate } }>(`/debates/${id}/join`)
  return data
}

export async function triggerScoring(id: string) {
  const { data } = await api.post<{ success: boolean; data: { job_id: string } }>(`/debates/${id}/score`)
  return data
}

export interface ScorecardData {
  debate_id: string
  topic: Topic
  winner_id: string | null
  creator_id: string | null
  opponent_id: string | null
  completed_at: string | null
  ai_scores: DebateScores | null
}

export async function getScorecard(id: string) {
  const { data } = await api.get<{ success: boolean; data: ScorecardData }>(`/debates/${id}/scorecard`)
  return data
}
