import { create } from 'zustand'
import { initialRedemptionRequests } from '../../../entities/quest/model/mockData'
import { type UserProfileRead } from '../../auth/api/authApi'
import { useAuthStore } from '../../auth/model/useAuthStore'
import { prizesApi } from '../api/prizesApi'
import { mapRedemptionCodeRead, redemptionsApi } from '../api/redemptionsApi'
import type { PrizeCatalogItem, RedemptionDraftItem, RedemptionRequest, RedemptionRequestItem } from '../../../shared/types/game'

interface CreateRedemptionPayload {
  items: Array<{
    prizeId: string
    quantity: number
  }>
}

interface RedemptionResult {
  success: boolean
  request?: RedemptionRequest
  error?: string
}

interface RedemptionStoreState {
  prizeCatalog: PrizeCatalogItem[]
  redemptions: RedemptionRequest[]
  redemptionDraftItems: RedemptionDraftItem[]
  isPrizeCatalogLoading: boolean
  setRedemptionDraftItem: (payload: RedemptionDraftItem) => void
  clearRedemptionDraft: () => void
  fetchPrizeCatalog: () => Promise<void>
  hydrateActiveRedemptions: (profile: UserProfileRead | null) => void
  clearRedemptionData: () => void
  createRedemptionRequest: (payload: CreateRedemptionPayload) => Promise<RedemptionResult>
  getActiveRedemptionForCurrentUser: () => RedemptionRequest | null
  getRedemptionById: (id: string) => RedemptionRequest | null
  findRedemptionByCode: (code: string) => RedemptionRequest | null
}

const normalizeCode = (code: string) => code.trim().toUpperCase()
const getDisplayNameFromEmail = (email: string) => email.split('@')[0] || email

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

export const useRedemptionStore = create<RedemptionStoreState>((set, get) => ({
  prizeCatalog: [],
  redemptions: initialRedemptionRequests,
  redemptionDraftItems: [],
  isPrizeCatalogLoading: false,
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
  fetchPrizeCatalog: async () => {
    const token = useAuthStore.getState().authToken

    if (!token) {
      set({ prizeCatalog: [], isPrizeCatalogLoading: false })
      return
    }

    set({ isPrizeCatalogLoading: true })

    try {
      const prizes = await prizesApi.list(token)
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
  hydrateActiveRedemptions: (profile) => {
    if (!profile) {
      set({ redemptions: [], redemptionDraftItems: [] })
      return
    }

    set({
      redemptions: (profile.active_redemptions ?? []).map((redemption) => {
        const mapped = mapRedemptionCodeRead(redemption)
        return {
          ...mapped,
          userId: profile.id,
          userName: getDisplayNameFromEmail(profile.email),
        }
      }),
    })
  },
  clearRedemptionData: () =>
    set({
      prizeCatalog: [],
      redemptions: [],
      redemptionDraftItems: [],
      isPrizeCatalogLoading: false,
    }),
  createRedemptionRequest: async ({ items }) => {
    const authState = useAuthStore.getState()
    const state = get()
    const token = authState.authToken
    const activeRequest = state.redemptions.find(
      (redemption) => redemption.userId === authState.user.id && redemption.status === 'active',
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

    if (totalPoints > authState.user.rewardPointsBalance) {
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

      const normalizedRequest = {
        ...request,
        userId: authState.user.id,
        userName: authState.user.name,
      }

      authState.updateUser((user) => ({
        ...user,
        rewardPointsBalance: Math.max(0, user.rewardPointsBalance - normalizedRequest.totalPoints),
      }))

      set((currentState) => ({
        redemptions: [
          normalizedRequest,
          ...currentState.redemptions.filter((existing) => normalizeCode(existing.code) !== normalizeCode(normalizedRequest.code)),
        ],
        redemptionDraftItems: [],
      }))

      return { success: true, request: normalizedRequest }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not create redemption code.',
      }
    }
  },
  getActiveRedemptionForCurrentUser: () => {
    const userId = useAuthStore.getState().user.id
    return get().redemptions.find((redemption) => redemption.userId === userId && redemption.status === 'active') ?? null
  },
  getRedemptionById: (id) => get().redemptions.find((redemption) => redemption.id === id) ?? null,
  findRedemptionByCode: (code) =>
    get().redemptions.find((redemption) => normalizeCode(redemption.code) === normalizeCode(code)) ?? null,
}))
