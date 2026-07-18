import api from './api'

export async function loginWithGoogle(idToken: string) {
  const { data } = await api.post('/auth/google', { idToken })
  return data
}

export async function registerWithEmail(email: string, password: string, display_name: string) {
  const { data } = await api.post('/auth/register', { email, password, display_name })
  return data
}

export async function loginWithEmail(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}
