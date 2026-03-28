import { create } from 'zustand'
import { type UserProfileRead } from '../../auth/api/authApi'
import { useAuthStore } from '../../auth/model/useAuthStore'
import { prizesApi } from '../api/prizesApi'
import { mapCodeRead, codesApi } from '../api/codesApi'
import type { PrizeCatalogItem, CodeDraftItem, CodeRequest, CodeRequestItem } from '../../../shared/types/game'

interface CreateCodePayload {
  items: Array<{
    prizeId: string
    quantity: number
  }>
}

interface CodeResult {
  success: boolean
  request?: CodeRequest
  error?: string
}

interface CancelCodeResult {
  success: boolean
  request?: CodeRequest
  error?: string
}

interface CodeStoreState {
  prizeCatalog: PrizeCatalogItem[]
  codes: CodeRequest[]
  codeDraftItems: CodeDraftItem[]
  isPrizeCatalogLoading: boolean
  setCodeDraftItem: (payload: CodeDraftItem) => void
  clearCodeDraft: () => void
  fetchPrizeCatalog: () => Promise<void>
  hydrateActiveCodes: (profile: UserProfileRead | null) => void
  clearCodeData: () => void
  createCodeRequest: (payload: CreateCodePayload) => Promise<CodeResult>
  cancelCurrentCode: () => Promise<CancelCodeResult>
  getActiveCodeForCurrentUser: () => CodeRequest | null
  getCodeById: (id: string) => CodeRequest | null
  findCodeByValue: (code: string) => CodeRequest | null
}

const normalizeCode = (code: string) => code.trim().toUpperCase()
const getDisplayNameFromEmail = (email: string) => email.split('@')[0] || email

const buildCodeItems = (
  catalog: PrizeCatalogItem[],
  payloadItems: CreateCodePayload['items'],
): CodeRequestItem[] => {
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
    .filter((item): item is CodeRequestItem => item !== null)
}

export const useCodeStore = create<CodeStoreState>((set, get) => ({
  prizeCatalog: [],
  codes: [],
  codeDraftItems: [],
  isPrizeCatalogLoading: false,
  setCodeDraftItem: ({ prizeId, quantity }) =>
    set((state) => {
      const safeQuantity = Math.max(0, Math.round(quantity))
      const nextItems = state.codeDraftItems.filter((item) => item.prizeId !== prizeId)

      if (safeQuantity <= 0) {
        return { codeDraftItems: nextItems }
      }

      return {
        codeDraftItems: [...nextItems, { prizeId, quantity: safeQuantity }],
      }
    }),
  clearCodeDraft: () => set({ codeDraftItems: [] }),
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
  hydrateActiveCodes: (profile) => {
    if (!profile) {
      set({ codes: [], codeDraftItems: [] })
      return
    }

    set({
      codes: (profile.active_codes ?? profile.active_redemptions ?? []).map((codeItem) => {
        const mapped = mapCodeRead(codeItem)
        return {
          ...mapped,
          userId: profile.id,
          userName: getDisplayNameFromEmail(profile.email),
        }
      }),
    })
  },
  clearCodeData: () =>
    set({
      prizeCatalog: [],
      codes: [],
      codeDraftItems: [],
      isPrizeCatalogLoading: false,
    }),
  createCodeRequest: async ({ items }) => {
    const authState = useAuthStore.getState()
    const state = get()
    const token = authState.authToken
    const activeCode = state.codes.find(
      (candidate) => candidate.userId === authState.user.id && candidate.status === 'active',
    )

    if (activeCode) {
      return {
        success: false,
        error: 'У вас уже есть активный код выдачи. Сначала используйте его у администратора.',
      }
    }

    const normalizedItems = buildCodeItems(state.prizeCatalog, items)

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
      const request = await codesApi.create(
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
        codes: [
          normalizedRequest,
          ...currentState.codes.filter((existing) => normalizeCode(existing.code) !== normalizeCode(normalizedRequest.code)),
        ],
        codeDraftItems: [],
      }))

      return { success: true, request: normalizedRequest }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not create code.',
      }
    }
  },
  cancelCurrentCode: async () => {
    const authState = useAuthStore.getState()
    const token = authState.authToken
    const activeCode = get().codes.find(
      (candidate) => candidate.userId === authState.user.id && candidate.status === 'active',
    )

    if (!token) {
      return { success: false, error: 'Требуется авторизация.' }
    }

    if (!activeCode) {
      return { success: false, error: 'Активный код выдачи не найден.' }
    }

    try {
      const cancelledRequest = await codesApi.cancel(token, activeCode.code)
      const normalizedRequest = {
        ...cancelledRequest,
        userId: authState.user.id,
        userName: authState.user.name,
      }

      authState.updateUser((user) => ({
        ...user,
        rewardPointsBalance: user.rewardPointsBalance + normalizedRequest.totalPoints,
      }))

      set((state) => ({
        codes: state.codes.map((candidate) =>
          normalizeCode(candidate.code) === normalizeCode(normalizedRequest.code) ? normalizedRequest : candidate,
        ),
      }))

      return { success: true, request: normalizedRequest }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not cancel code.',
      }
    }
  },
  getActiveCodeForCurrentUser: () => {
    const userId = useAuthStore.getState().user.id
    return get().codes.find((candidate) => candidate.userId === userId && candidate.status === 'active') ?? null
  },
  getCodeById: (id) => get().codes.find((candidate) => candidate.id === id) ?? null,
  findCodeByValue: (code) =>
    get().codes.find((candidate) => normalizeCode(candidate.code) === normalizeCode(code)) ?? null,
}))
