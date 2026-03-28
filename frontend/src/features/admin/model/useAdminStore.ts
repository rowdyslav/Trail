import { create } from 'zustand'
import { adminAuthApi } from '../../auth/api/adminAuthApi'
import type { AuthResult } from '../../auth/model/useAuthStore'

const ADMIN_TOKEN_STORAGE_KEY = 'trail.admin.token'
const ADMIN_EMAIL_STORAGE_KEY = 'trail.admin.email'

export interface AdminSession {
  email: string
  token: string
}

interface AdminState {
  adminSession: AdminSession | null
  loginAdmin: (email: string, password: string) => Promise<AuthResult>
  logoutAdmin: () => void
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

export const useAdminStore = create<AdminState>((set) => ({
  adminSession: getStoredAdminSession(),
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
}))
