import axios from 'axios'
import { getAccessToken, setAccessToken } from './authStore'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

let onAuthExpired: (() => void) | null = null

export function setOnAuthExpired(cb: () => void) {
  onAuthExpired = cb
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAccessToken(null)
      onAuthExpired?.()
    }
    return Promise.reject(error)
  },
)

export default api
