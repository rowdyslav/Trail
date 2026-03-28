import { create } from 'zustand'
import { useAdminStore } from '../../admin/model/useAdminStore'
import {
  adminCodesApi,
  type AdminCodeConfirmation,
  type AdminCodeValidation,
} from '../api/adminCodesApi'

interface AdminCodeLookupResult {
  success: boolean
  validation?: AdminCodeValidation
  error?: string
}

interface AdminCodeConfirmResult {
  success: boolean
  confirmation?: AdminCodeConfirmation
  error?: string
}

interface AdminCodeStoreState {
  readAdminCodeByValue: (code: string) => Promise<AdminCodeLookupResult>
  confirmCodeIssuance: (payload: { code: string }) => Promise<AdminCodeConfirmResult>
}

export const useAdminCodeStore = create<AdminCodeStoreState>(() => ({
  readAdminCodeByValue: async (code) => {
    const session = useAdminStore.getState().adminSession

    if (!session) {
      return { success: false, error: 'Требуется авторизация администратора.' }
    }

    try {
      const validation = await adminCodesApi.readByCode(code, session.token)
      return { success: true, validation }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not load code.',
      }
    }
  },
  confirmCodeIssuance: async ({ code }) => {
    const session = useAdminStore.getState().adminSession

    if (!session) {
      return { success: false, error: 'Требуется авторизация администратора.' }
    }

    try {
      const confirmation = await adminCodesApi.confirmByCode(code, session.token)
      return { success: true, confirmation }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not confirm code.',
      }
    }
  },
}))
