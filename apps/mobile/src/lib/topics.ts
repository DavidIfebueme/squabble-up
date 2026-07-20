import api from './api'
import type { Topic, PaginatedResponse } from '@squabble-up/shared'

export async function getTopics(params?: { category?: string; page?: number; limit?: number }) {
  const { data } = await api.get<PaginatedResponse<Topic>>('/topics', { params })
  return data
}

export async function getTopicByIdentifier(identifier: string) {
  const { data } = await api.get<{ success: boolean; data: Topic }>(`/topics/${identifier}`)
  return data
}

export async function createTopic(body: { title: string; description: string; category: string }) {
  const { data } = await api.post<{ success: boolean; data: Topic }>('/topics', body)
  return data
}
