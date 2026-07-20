import api from './api'

export async function createGuestSession(displayName: string) {
  const { data } = await api.post('/debates/guest-session', { display_name: displayName })
  return data
}
