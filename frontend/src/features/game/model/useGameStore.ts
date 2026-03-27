import { create } from 'zustand'
import {
  avatarStages,
  catalogRoutes,
  initialRedemptionRequests,
  mockRoute,
  mockUser,
  rewardOptions,
} from '../../../entities/quest/model/mockData'
import { authApi, type UserRead } from '../../auth/api/authApi'
import { getCurrentCheckpoint, matchesCheckpointQr } from '../../scan/model/qrPayload'
import type {
  CatalogRoute,
  Checkpoint,
  RedemptionRequest,
  RewardOption,
  RouteDetails,
  UserProfile,
} from '../../../shared/types/game'

const AUTH_TOKEN_STORAGE_KEY = 'trail.auth.token'

interface RewardState {
  title: string
  description: string
  xp: number
}

interface AdminSession {
  username: string
}

interface ConfirmRedemptionPayload {
  code: string
  rewardId?: string
  pointsAmount?: number
}

interface AuthResult {
  success: boolean
  error?: string
}

interface GameState {
  route: RouteDetails
  catalogRoutes: CatalogRoute[]
  rewardOptions: RewardOption[]
  redemptions: RedemptionRequest[]
  user: UserProfile
  isScanOpen: boolean
  isScanning: boolean
  activeReward: RewardState | null
  adminSession: AdminSession | null
  authToken: string | null
  isAuthReady: boolean
  isAuthLoading: boolean
  openScan: () => void
  closeScan: () => void
  completeScan: (value: string) => { success: boolean; error?: string }
  setScanning: (value: boolean) => void
  closeReward: () => void
  createRedemptionRequest: (payload: { rewardId?: string; pointsAmount?: number }) => RedemptionRequest | null
  getRedemptionById: (id: string) => RedemptionRequest | null
  findRedemptionByCode: (code: string) => RedemptionRequest | null
  loginAdmin: (username: string, password: string) => boolean
  logoutAdmin: () => void
  confirmRedemption: (payload: ConfirmRedemptionPayload) => { success: boolean; error?: string }
  initializeAuth: () => Promise<void>
  loginUser: (email: string, password: string) => Promise<AuthResult>
  registerUser: (email: string, password: string) => Promise<AuthResult>
  logoutUser: () => void
  refreshMe: () => Promise<void>
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

const getRouteProgress = (checkpoints: Checkpoint[]) => {
  const completedCount = checkpoints.filter((checkpoint) => checkpoint.status === 'completed').length
  return Math.round((completedCount / checkpoints.length) * 100)
}

const updateAvatarStage = (xp: number) => {
  if (xp >= 1600) return avatarStages[3].id
  if (xp >= 1200) return avatarStages[2].id
  if (xp >= 800) return avatarStages[1].id
  return avatarStages[0].id
}

const createRedemptionCode = () => `TRL-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`

const normalizeCode = (code: string) => code.trim().toUpperCase()

const getDisplayNameFromEmail = (email: string) => email.split('@')[0] || email

const mapApiUserToProfile = (apiUser: UserRead, previousUser: UserProfile): UserProfile => ({
  ...previousUser,
  id: apiUser.id,
  email: apiUser.email,
  name: getDisplayNameFromEmail(apiUser.email),
  streakDays: apiUser.streak_days,
  rewardPointsBalance: apiUser.reward_points,
})

export const useGameStore = create<GameState>((set, get) => ({
  route: {
    ...mockRoute,
    progress: getRouteProgress(mockRoute.checkpoints),
  },
  catalogRoutes,
  rewardOptions,
  redemptions: initialRedemptionRequests,
  user: mockUser,
  isScanOpen: false,
  isScanning: false,
  activeReward: null,
  adminSession: null,
  authToken: getStoredToken(),
  isAuthReady: false,
  isAuthLoading: false,
  openScan: () => set({ isScanOpen: true }),
  closeScan: () => set({ isScanOpen: false, isScanning: false }),
  setScanning: (value) => set({ isScanning: value }),
  closeReward: () => set({ activeReward: null }),
  completeScan: (value) => {
    const state = get()
    const currentCheckpoint = getCurrentCheckpoint(state.route.checkpoints)

    if (!currentCheckpoint) {
      set({ isScanning: false, isScanOpen: false })
      return { success: false, error: 'Маршрут уже завершён.' }
    }

    if (!matchesCheckpointQr(value, currentCheckpoint.id)) {
      set({ isScanning: false })
      return { success: false, error: 'Этот QR-код не относится к текущей точке маршрута.' }
    }

    set((currentState) => {
      const activeCheckpoint = getCurrentCheckpoint(currentState.route.checkpoints)

      if (!activeCheckpoint) {
        return {
          isScanning: false,
          isScanOpen: false,
        }
      }

      const completedRoute = currentState.route.checkpoints.map((checkpoint, index, checkpoints) => {
        if (checkpoint.id === activeCheckpoint.id) {
          return { ...checkpoint, status: 'completed' as const }
        }

        const previousCheckpoint = checkpoints[index - 1]

        if (checkpoint.status === 'locked' && previousCheckpoint?.id === activeCheckpoint.id) {
          return { ...checkpoint, status: 'available' as const }
        }

        return checkpoint
      })

      const nextXp = currentState.user.xp + activeCheckpoint.xp
      const nextPoints = currentState.user.rewardPointsBalance + Math.round(activeCheckpoint.xp * 0.4)

      return {
        isScanning: false,
        isScanOpen: false,
        activeReward: {
          title: activeCheckpoint.reward.title,
          description: activeCheckpoint.reward.description,
          xp: activeCheckpoint.xp,
        },
        route: {
          ...currentState.route,
          checkpoints: completedRoute,
          progress: getRouteProgress(completedRoute),
        },
        user: {
          ...currentState.user,
          xp: nextXp,
          rewardPointsBalance: nextPoints,
          level: nextXp >= currentState.user.nextLevelXp ? currentState.user.level + 1 : currentState.user.level,
          avatarStage: updateAvatarStage(nextXp),
        },
      }
    })

    return { success: true }
  },
  createRedemptionRequest: ({ rewardId, pointsAmount }) => {
    const state = get()
    const selectedReward = rewardId ? state.rewardOptions.find((reward) => reward.id === rewardId) : null
    const normalizedAmount = pointsAmount ? Math.max(0, Math.round(pointsAmount)) : undefined
    const requestedPoints = selectedReward?.pointsCost ?? normalizedAmount

    if (!requestedPoints || requestedPoints <= 0) {
      return null
    }

    if (requestedPoints > state.user.rewardPointsBalance) {
      return null
    }

    const request: RedemptionRequest = {
      id: `redemption-${Date.now()}`,
      code: createRedemptionCode(),
      status: 'created',
      kind: selectedReward ? 'reward' : 'custom_amount',
      userName: state.user.name,
      createdAt: new Date().toISOString(),
      preferredRewardId: selectedReward?.id,
      preferredPointsAmount: requestedPoints,
    }

    set((currentState) => ({
      redemptions: [request, ...currentState.redemptions],
    }))

    return request
  },
  getRedemptionById: (id) => get().redemptions.find((redemption) => redemption.id === id) ?? null,
  findRedemptionByCode: (code) =>
    get().redemptions.find((redemption) => normalizeCode(redemption.code) === normalizeCode(code)) ?? null,
  loginAdmin: (username, password) => {
    const canLogin = username.trim().toLowerCase() === 'admin' && password === 'trail123'

    if (canLogin) {
      set({
        adminSession: {
          username: username.trim(),
        },
      })
    }

    return canLogin
  },
  logoutAdmin: () => set({ adminSession: null }),
  confirmRedemption: ({ code, rewardId, pointsAmount }) => {
    const state = get()
    const redemption = state.redemptions.find((item) => normalizeCode(item.code) === normalizeCode(code))

    if (!redemption) {
      return { success: false, error: 'Код не найден.' }
    }

    if (redemption.status === 'issued') {
      return { success: false, error: 'Этот код уже обработан.' }
    }

    const selectedReward = rewardId ? state.rewardOptions.find((reward) => reward.id === rewardId) : null
    const resolvedPoints = selectedReward?.pointsCost ?? (pointsAmount ? Math.max(0, Math.round(pointsAmount)) : 0)

    if (!resolvedPoints) {
      return { success: false, error: 'Укажите награду или сумму списания.' }
    }

    if (resolvedPoints > state.user.rewardPointsBalance) {
      return { success: false, error: 'У пользователя недостаточно очков для списания.' }
    }

    set((currentState) => ({
      user: {
        ...currentState.user,
        rewardPointsBalance: currentState.user.rewardPointsBalance - resolvedPoints,
      },
      redemptions: currentState.redemptions.map((item) =>
        item.id === redemption.id
          ? {
              ...item,
              status: 'issued',
              issuedRewardId: selectedReward?.id,
              issuedPointsAmount: resolvedPoints,
              confirmedAt: new Date().toISOString(),
            }
          : item,
      ),
    }))

    return { success: true }
  },
  initializeAuth: async () => {
    const token = get().authToken

    if (!token) {
      set({ isAuthReady: true, isAuthLoading: false })
      return
    }

    set({ isAuthLoading: true })

    try {
      const apiUser = await authApi.readMe(token)
      set((state) => ({
        user: mapApiUserToProfile(apiUser, state.user),
        isAuthReady: true,
        isAuthLoading: false,
      }))
    } catch {
      setStoredToken(null)
      set({
        authToken: null,
        isAuthReady: true,
        isAuthLoading: false,
      })
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

      return { success: true }
    } catch (error) {
      set({ isAuthLoading: false, isAuthReady: true })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось выполнить вход.',
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

      return { success: true }
    } catch (error) {
      set({ isAuthLoading: false, isAuthReady: true })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось выполнить регистрацию.',
      }
    }
  },
  logoutUser: () => {
    setStoredToken(null)
    set({
      authToken: null,
      isAuthReady: true,
      isAuthLoading: false,
      user: mockUser,
    })
  },
  refreshMe: async () => {
    const token = get().authToken

    if (!token) {
      return
    }

    set({ isAuthLoading: true })

    try {
      const apiUser = await authApi.readMe(token)
      set((state) => ({
        user: mapApiUserToProfile(apiUser, state.user),
        isAuthLoading: false,
        isAuthReady: true,
      }))
    } catch {
      setStoredToken(null)
      set({
        authToken: null,
        isAuthLoading: false,
        isAuthReady: true,
      })
    }
  },
}))
