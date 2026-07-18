import { create } from 'zustand'

type AuthState = {
  token: string | null
  user: Record<string, unknown> | null
  isAuthenticated: boolean
  setAuth: (token: string, user: Record<string, unknown>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}))
