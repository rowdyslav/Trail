import { create } from 'zustand'
import { useAdminStore } from '../../admin/model/useAdminStore'
import {
  adminRedemptionsApi,
  type AdminRedemptionConfirmation,
  type AdminRedemptionValidation,
} from '../api/adminRedemptionsApi'

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

interface AdminRedemptionStoreState {
  readAdminRedemptionByCode: (code: string) => Promise<AdminRedemptionLookupResult>
  confirmRedemptionIssuance: (payload: { code: string }) => Promise<AdminRedemptionConfirmResult>
}

export const useAdminRedemptionStore = create<AdminRedemptionStoreState>(() => ({
  readAdminRedemptionByCode: async (code) => {
    const session = useAdminStore.getState().adminSession

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
    const session = useAdminStore.getState().adminSession

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
}))
