import api from './api'
import type { Vote } from './types'

export async function submitVote(data: {
  debate_id: string
  vote_type: 'creator' | 'opponent'
  logic_score?: number
  evidence_score?: number
  delivery_score?: number
}) {
  const { data: response } = await api.post('/votes', data)
  return response
}

export async function getVotes(debateId: string) {
  const { data } = await api.get<{ data: Vote[] }>(`/votes/debate/${debateId}`)
  return data
}