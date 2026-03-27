import { create } from 'zustand'
import {
  avatarStages,
  catalogRoutes,
  initialRedemptionRequests,
  mockRoute,
  mockUser,
} from '../../../entities/quest/model/mockData'
import { authApi, type UserProfileRead } from '../../auth/api/authApi'
import { adminAuthApi } from '../../auth/api/adminAuthApi'
import { getCurrentCheckpoint, matchesCheckpointQr } from '../../scan/model/qrPayload'
import {
  adminRedemptionsApi,
  type AdminRedemptionConfirmation,
  type AdminRedemptionValidation,
} from '../../redemption/api/adminRedemptionsApi'
import { prizesApi } from '../../redemption/api/prizesApi'
import { redemptionsApi } from '../../redemption/api/redemptionsApi'
import type {
  CatalogRoute,
  Checkpoint,
  RedemptionDraftItem,
  PrizeCatalogItem,
  RedemptionRequest,
  RedemptionRequestItem,
  RouteDetails,
  UserProfile,
} from '../../../shared/types/game'

const AUTH_TOKEN_STORAGE_KEY = 'trail.auth.token'
const ADMIN_TOKEN_STORAGE_KEY = 'trail.admin.token'
const ADMIN_EMAIL_STORAGE_KEY = 'trail.admin.email'

interface RewardState {
  title: string
  description: string
  xp: number
}

interface AdminSession {
  email: string
  token: string
}

interface CreateRedemptionPayload {
  items: Array<{
    prizeId: string
    quantity: number
  }>
}

interface AuthResult {
  success: boolean
  error?: string
}

interface RedemptionResult {
  success: boolean
  request?: RedemptionRequest
  error?: string
}

interface AdminRedemptionLookupResult {
  success: boolean
  validation?: AdminRedemptionValidation
  error?: string
}

interface AdminRedemptionConfirmResult {
  success: boolean
  confirmation?: AdminRedemptionConfirmation
  error?: string
}

interface GameState {
  route: RouteDetails
  catalogRoutes: CatalogRoute[]
  prizeCatalog: PrizeCatalogItem[]
  redemptions: RedemptionRequest[]
  redemptionDraftItems: RedemptionDraftItem[]
  user: UserProfile
  isScanOpen: boolean
  isScanning: boolean
  activeReward: RewardState | null
  adminSession: AdminSession | null
  authToken: string | null
  isAuthReady: boolean
  isAuthLoading: boolean
  isPrizeCatalogLoading: boolean
  openScan: () => void
  closeScan: () => void
  completeScan: (value: string) => { success: boolean; error?: string }
  setScanning: (value: boolean) => void
  closeReward: () => void
  setRedemptionDraftItem: (payload: RedemptionDraftItem) => void
  clearRedemptionDraft: () => void
  createRedemptionRequest: (payload: CreateRedemptionPayload) => Promise<RedemptionResult>
  getActiveRedemptionForCurrentUser: () => RedemptionRequest | null
  getRedemptionById: (id: string) => RedemptionRequest | null
  findRedemptionByCode: (code: string) => RedemptionRequest | null
  loginAdmin: (email: string, password: string) => Promise<AuthResult>
  logoutAdmin: () => void
  readAdminRedemptionByCode: (code: string) => Promise<AdminRedemptionLookupResult>
  confirmRedemptionIssuance: (payload: { code: string }) => Promise<AdminRedemptionConfirmResult>
  initializeAuth: () => Promise<void>
  fetchPrizeCatalog: () => Promise<void>
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

const getStoredAdminSession = (): AdminSession | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)
  const email = window.localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY)

  if (!token || !email) {
    return null
  }

  return { email, token }
}

const setStoredAdminSession = (session: AdminSession | null) => {
  if (typeof window === 'undefined') {
    return
  }

  if (session) {
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, session.token)
    window.localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, session.email)
    return
  }

  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY)
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

const normalizeCode = (code: string) => code.trim().toUpperCase()

const getDisplayNameFromEmail = (email: string) => email.split('@')[0] || email

const mapApiUserToProfile = (apiUser: UserProfileRead, previousUser: UserProfile): UserProfile => ({
  ...previousUser,
  id: apiUser.id,
  email: apiUser.email,
  name: getDisplayNameFromEmail(apiUser.email),
  streakDays: apiUser.streak_days,
  rewardPointsBalance: apiUser.reward_points,
})

const mapActiveRedemptions = (apiUser: UserProfileRead, previousUser: UserProfile): RedemptionRequest[] =>
  (apiUser.active_redemptions ?? []).map((redemption) => ({
    id: redemption.code,
    code: redemption.code,
    status: redemption.status,
    userId: apiUser.id,
    userName: getDisplayNameFromEmail(apiUser.email) || previousUser.name,
    createdAt: redemption.created_at,
    issuedAt: redemption.used_at ?? undefined,
    totalPoints: redemption.requested_points,
    items: redemption.items.map((item) => ({
      prizeId: item.prize_id,
      titleSnapshot: item.title,
      pointsCostSnapshot: item.points_cost,
      quantity: item.quantity,
      totalPoints: item.points_cost * item.quantity,
    })),
  }))

const readPrizeCatalog = async (token: string) => {
  try {
    return await prizesApi.list(token)
  } catch {
    return []
  }
}

const buildRedemptionItems = (
  catalog: PrizeCatalogItem[],
  payloadItems: CreateRedemptionPayload['items'],
): RedemptionRequestItem[] => {
  return payloadItems
    .map(({ prizeId, quantity }) => {
      const catalogItem = catalog.find((item) => item.id === prizeId && item.isActive !== false)
      const safeQuantity = Math.max(0, Math.round(quantity))

      if (!catalogItem || safeQuantity <= 0) {
        return null
      }

      return {
        prizeId: catalogItem.id,
        titleSnapshot: catalogItem.title,
        pointsCostSnapshot: catalogItem.pointsCost,
        quantity: safeQuantity,
        totalPoints: catalogItem.pointsCost * safeQuantity,
      }
    })
    .filter((item): item is RedemptionRequestItem => item !== null)
}

export const useGameStore = create<GameState>((set, get) => ({
  route: {
    ...mockRoute,
    progress: getRouteProgress(mockRoute.checkpoints),
  },
  catalogRoutes,
  prizeCatalog: [],
  redemptions: initialRedemptionRequests,
  redemptionDraftItems: [],
  user: mockUser,
  isScanOpen: false,
  isScanning: false,
  activeReward: null,
  adminSession: getStoredAdminSession(),
  authToken: getStoredToken(),
  isAuthReady: false,
  isAuthLoading: false,
  isPrizeCatalogLoading: false,
  openScan: () => set({ isScanOpen: true }),
  closeScan: () => set({ isScanOpen: false, isScanning: false }),
  setScanning: (value) => set({ isScanning: value }),
  closeReward: () => set({ activeReward: null }),
  setRedemptionDraftItem: ({ prizeId, quantity }) =>
    set((state) => {
      const safeQuantity = Math.max(0, Math.round(quantity))
      const nextItems = state.redemptionDraftItems.filter((item) => item.prizeId !== prizeId)

      if (safeQuantity <= 0) {
        return { redemptionDraftItems: nextItems }
      }

      return {
        redemptionDraftItems: [...nextItems, { prizeId, quantity: safeQuantity }],
      }
    }),
  clearRedemptionDraft: () => set({ redemptionDraftItems: [] }),
  completeScan: (value) => {
    const state = get()
    const currentCheckpoint = getCurrentCheckpoint(state.route.checkpoints)

    if (!currentCheckpoint) {
      set({ isScanning: false, isScanOpen: false })
      return { success: false, error: 'Route is already completed.' }
    }

    if (!matchesCheckpointQr(value, currentCheckpoint.id)) {
      set({ isScanning: false })
      return { success: false, error: 'This QR code does not match the current checkpoint.' }
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
  createRedemptionRequest: async ({ items }) => {
    const state = get()
    const token = state.authToken
    const activeRequest = state.redemptions.find(
      (redemption) => redemption.userId === state.user.id && redemption.status === 'active',
    )

    if (activeRequest) {
      return {
        success: false,
        error: 'У вас уже есть активный код выдачи. Сначала используйте его у администратора.',
      }
    }

    const normalizedItems = buildRedemptionItems(state.prizeCatalog, items)

    if (normalizedItems.length === 0) {
      return { success: false, error: 'Выберите хотя бы один приз.' }
    }

    const totalPoints = normalizedItems.reduce((sum, item) => sum + item.totalPoints, 0)

    if (totalPoints > state.user.rewardPointsBalance) {
      return { success: false, error: 'Недостаточно баллов для создания этой заявки.' }
    }

    if (!token) {
      return { success: false, error: 'Требуется авторизация.' }
    }

    try {
      const request = await redemptionsApi.create(
        token,
        items.map((item) => ({
          prize_id: item.prizeId,
          quantity: item.quantity,
        })),
      )

      request.userId = state.user.id
      request.userName = state.user.name

      set((currentState) => ({
        user: {
          ...currentState.user,
          rewardPointsBalance: Math.max(0, currentState.user.rewardPointsBalance - request.totalPoints),
        },
        redemptions: [
          request,
          ...currentState.redemptions.filter((existing) => normalizeCode(existing.code) !== normalizeCode(request.code)),
        ],
        redemptionDraftItems: [],
      }))

      return { success: true, request }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not create redemption code.',
      }
    }
  },
  getActiveRedemptionForCurrentUser: () => {
    const state = get()
    return state.redemptions.find((redemption) => redemption.userId === state.user.id && redemption.status === 'active') ?? null
  },
  getRedemptionById: (id) => get().redemptions.find((redemption) => redemption.id === id) ?? null,
  findRedemptionByCode: (code) =>
    get().redemptions.find((redemption) => normalizeCode(redemption.code) === normalizeCode(code)) ?? null,
  loginAdmin: async (email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase()
      const tokenResponse = await adminAuthApi.login(normalizedEmail, password)
      const session = {
        email: normalizedEmail,
        token: tokenResponse.access_token,
      }

      setStoredAdminSession(session)
      set({ adminSession: session })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not complete admin login.',
      }
    }
  },
  logoutAdmin: () => {
    setStoredAdminSession(null)
    set({ adminSession: null })
  },
  readAdminRedemptionByCode: async (code) => {
    const session = get().adminSession

    if (!session) {
      return { success: false, error: 'Требуется авторизация администратора.' }
    }

    try {
      const validation = await adminRedemptionsApi.readByCode(code, session.token)
      return { success: true, validation }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not load redemption code.',
      }
    }
  },
  confirmRedemptionIssuance: async ({ code }) => {
    const session = get().adminSession

    if (!session) {
      return { success: false, error: 'Требуется авторизация администратора.' }
    }

    try {
      const confirmation = await adminRedemptionsApi.confirmByCode(code, session.token)
      return { success: true, confirmation }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not confirm redemption code.',
      }
    }
  },
  initializeAuth: async () => {
    const token = get().authToken

    if (!token) {
      set({ isAuthReady: true, isAuthLoading: false, prizeCatalog: [], isPrizeCatalogLoading: false })
      return
    }

    set({ isAuthLoading: true, isPrizeCatalogLoading: true })

    try {
      const apiUser = await authApi.readMe(token)
      const prizes = await readPrizeCatalog(token)
      set((state) => ({
        user: mapApiUserToProfile(apiUser, state.user),
        redemptions: mapActiveRedemptions(apiUser, state.user),
        prizeCatalog: prizes,
        isAuthReady: true,
        isAuthLoading: false,
        isPrizeCatalogLoading: false,
      }))
    } catch {
      setStoredToken(null)
      set({
        authToken: null,
        isAuthReady: true,
        isAuthLoading: false,
        prizeCatalog: [],
        isPrizeCatalogLoading: false,
      })
    }
  },
  fetchPrizeCatalog: async () => {
    const token = get().authToken

    if (!token) {
      set({ prizeCatalog: [], isPrizeCatalogLoading: false })
      return
    }

    set({ isPrizeCatalogLoading: true })

    try {
      const prizes = await readPrizeCatalog(token)
      set({
        prizeCatalog: prizes,
        isPrizeCatalogLoading: false,
      })
    } catch {
      set({
        prizeCatalog: [],
        isPrizeCatalogLoading: false,
      })
    }
  },
  loginUser: async (email, password) => {
    set({ isAuthLoading: true, isPrizeCatalogLoading: true })

    try {
      const tokenResponse = await authApi.login(email, password)
      setStoredToken(tokenResponse.access_token)
      const apiUser = await authApi.readMe(tokenResponse.access_token)
      const prizes = await readPrizeCatalog(tokenResponse.access_token)

      set((state) => ({
        authToken: tokenResponse.access_token,
        user: mapApiUserToProfile(apiUser, state.user),
        redemptions: mapActiveRedemptions(apiUser, state.user),
        prizeCatalog: prizes,
        isAuthReady: true,
        isAuthLoading: false,
        isPrizeCatalogLoading: false,
      }))

      return { success: true }
    } catch (error) {
      set({ isAuthLoading: false, isAuthReady: true, isPrizeCatalogLoading: false })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not complete login.',
      }
    }
  },
  registerUser: async (email, password) => {
    set({ isAuthLoading: true, isPrizeCatalogLoading: true })

    try {
      const tokenResponse = await authApi.register(email, password)
      setStoredToken(tokenResponse.access_token)
      const apiUser = await authApi.readMe(tokenResponse.access_token)
      const prizes = await readPrizeCatalog(tokenResponse.access_token)

      set((state) => ({
        authToken: tokenResponse.access_token,
        user: mapApiUserToProfile(apiUser, state.user),
        redemptions: mapActiveRedemptions(apiUser, state.user),
        prizeCatalog: prizes,
        isAuthReady: true,
        isAuthLoading: false,
        isPrizeCatalogLoading: false,
      }))

      return { success: true }
    } catch (error) {
      set({ isAuthLoading: false, isAuthReady: true, isPrizeCatalogLoading: false })
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
      isPrizeCatalogLoading: false,
      user: mockUser,
      prizeCatalog: [],
      redemptions: initialRedemptionRequests,
      redemptionDraftItems: [],
    })
  },
  refreshMe: async () => {
    const token = get().authToken

    if (!token) {
      return
    }

    set({ isAuthLoading: true, isPrizeCatalogLoading: true })

    try {
      const apiUser = await authApi.readMe(token)
      const prizes = await readPrizeCatalog(token)
      set((state) => ({
        user: mapApiUserToProfile(apiUser, state.user),
        redemptions: mapActiveRedemptions(apiUser, state.user),
        prizeCatalog: prizes,
        isAuthLoading: false,
        isAuthReady: true,
        isPrizeCatalogLoading: false,
      }))
    } catch {
      setStoredToken(null)
      set({
        authToken: null,
        isAuthLoading: false,
        isAuthReady: true,
        prizeCatalog: [],
        isPrizeCatalogLoading: false,
      })
    }
  },
}))
