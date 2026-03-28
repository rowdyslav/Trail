import { create } from 'zustand'
import { authApi, type UserProfileRead } from '../api/authApi'
import type { UserProfile } from '../../../shared/types/game'

const AUTH_TOKEN_STORAGE_KEY = 'trail.auth.token'

export interface AuthResult {
  success: boolean
  error?: string
  profile?: UserProfileRead | null
}

interface AuthState {
  user: UserProfile
  authToken: string | null
  isAuthReady: boolean
  isAuthLoading: boolean
  initializeAuth: () => Promise<UserProfileRead | null>
  loginUser: (email: string, password: string) => Promise<AuthResult>
  registerUser: (email: string, password: string) => Promise<AuthResult>
  logoutUser: () => void
  refreshMe: () => Promise<AuthResult>
  updateUser: (updater: (user: UserProfile) => UserProfile) => void
}

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
}

const setStoredToken = (token: string | null) => {
  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
}

const emptyUser: UserProfile = {
  id: '',
  email: undefined,
  name: 'Гость',
  title: 'Путешественник',
  rewardPointsBalance: 0,
  streakDays: 0,
  streakKey: 'novice',
  activeRouteId: null,
  purchasedRouteIds: [],
  badges: [],
}
const getDisplayNameFromEmail = (email: string) => email.split('@')[0] || email

const mapApiUserToProfile = (apiUser: UserProfileRead, previousUser: UserProfile): UserProfile => ({
  ...previousUser,
  id: apiUser.id,
  email: apiUser.email,
  name: getDisplayNameFromEmail(apiUser.email),
  streakDays: apiUser.streak_days,
  streakKey: apiUser.streak_key,
  rewardPointsBalance: apiUser.reward_points,
  activeRouteId: apiUser.active_route_id ?? null,
  purchasedRouteIds: apiUser.purchased_route_ids ?? [],
})

export const useAuthStore = create<AuthState>((set, get) => ({
  user: emptyUser,
  authToken: getStoredToken(),
  isAuthReady: false,
  isAuthLoading: false,
  initializeAuth: async () => {
    const token = get().authToken

    if (!token) {
      set({ isAuthReady: true, isAuthLoading: false, user: emptyUser })
      return null
    }

    set({ isAuthLoading: true })

    try {
      const apiUser = await authApi.readMe(token)
      set((state) => ({
        user: mapApiUserToProfile(apiUser, state.user),
        isAuthReady: true,
        isAuthLoading: false,
      }))
      return apiUser
    } catch {
      setStoredToken(null)
      set({
        authToken: null,
        user: emptyUser,
        isAuthReady: true,
        isAuthLoading: false,
      })
      return null
    }
  },
  loginUser: async (email, password) => {
    set({ isAuthLoading: true })

    try {
      const tokenResponse = await authApi.login(email, password)
      setStoredToken(tokenResponse.access_token)
      const apiUser = await authApi.readMe(tokenResponse.access_token)

      set((state) => ({
        authToken: tokenResponse.access_token,
        user: mapApiUserToProfile(apiUser, state.user),
        isAuthReady: true,
        isAuthLoading: false,
      }))

      return { success: true, profile: apiUser }
    } catch (error) {
      set({ isAuthLoading: false, isAuthReady: true })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not complete login.',
      }
    }
  },
  registerUser: async (email, password) => {
    set({ isAuthLoading: true })

    try {
      const tokenResponse = await authApi.register(email, password)
      setStoredToken(tokenResponse.access_token)
      const apiUser = await authApi.readMe(tokenResponse.access_token)

      set((state) => ({
        authToken: tokenResponse.access_token,
        user: mapApiUserToProfile(apiUser, state.user),
        isAuthReady: true,
        isAuthLoading: false,
      }))

      return { success: true, profile: apiUser }
    } catch (error) {
      set({ isAuthLoading: false, isAuthReady: true })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not complete registration.',
      }
    }
  },
  logoutUser: () => {
    setStoredToken(null)
    set({
      authToken: null,
      isAuthReady: true,
      isAuthLoading: false,
      user: emptyUser,
    })
  },
  refreshMe: async () => {
    const token = get().authToken

    if (!token) {
      return { success: false, error: 'Authorization required.' }
    }

    set({ isAuthLoading: true })

    try {
      const apiUser = await authApi.readMe(token)
      set((state) => ({
        user: mapApiUserToProfile(apiUser, state.user),
        isAuthLoading: false,
        isAuthReady: true,
      }))
      return { success: true, profile: apiUser }
    } catch {
      setStoredToken(null)
      set({
        authToken: null,
        user: emptyUser,
        isAuthLoading: false,
        isAuthReady: true,
      })
      return { success: false, error: 'Could not refresh user profile.' }
    }
  },
  updateUser: (updater) => {
    set((state) => ({
      user: updater(state.user),
    }))
  },
}))

