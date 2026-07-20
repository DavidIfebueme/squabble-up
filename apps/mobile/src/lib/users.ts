import api from './api'

export async function getMyProfile() {
  const { data } = await api.get('/users/me')
  return data
}

export async function getUserProfile(id: string) {
  const { data } = await api.get(`/users/${id}`)
  return data
}

export async function updateProfile(body: { display_name?: string; avatar_url?: string }) {
  const { data } = await api.patch('/users/me', body)
  return data
}

export async function getUserStats(id: string) {
  const { data } = await api.get(`/users/${id}/stats`)
  return data
}

export async function getUserHistory(id: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/users/${id}/history`, { params })
  return data
}
