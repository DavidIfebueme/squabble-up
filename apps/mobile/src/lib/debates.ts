import api from './api'
import type { Debate, PaginatedResponse } from '@squabble-up/shared'

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

export async function createDebate(body: { topic_id: string; participant_role?: 'creator' | 'opponent' }) {
  const { data } = await api.post<{ success: boolean; data: { debate: Debate } }>('/debates', body)
  return data
}

export async function joinDebate(id: string) {
  const { data } = await api.post<{ success: boolean; data: { debate: Debate } }>(`/debates/${id}/join`)
  return data
}
