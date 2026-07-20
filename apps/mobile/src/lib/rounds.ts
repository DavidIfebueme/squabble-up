import api from './api'
import type { Round } from '@squabble-up/shared'

export async function getRoundsByDebate(debateId: string) {
  const { data } = await api.get<{ success: boolean; data: Round[] }>(`/rounds/debate/${debateId}`)
  return data
}

export async function createRound(debateId: string, roundNumber: number) {
  const { data } = await api.post<{ success: boolean; data: Round }>('/rounds', {
    debate_id: debateId,
    round_number: roundNumber,
  })
  return data
}

export async function updateRound(id: string, body: { transcription?: string; duration?: number }) {
  const { data } = await api.patch<{ success: boolean; data: Round }>(`/rounds/${id}`, body)
  return data
}
