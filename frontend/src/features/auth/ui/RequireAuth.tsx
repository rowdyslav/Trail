import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../model/useAuthStore'

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const authToken = useAuthStore((state) => state.authToken)
  const isAuthReady = useAuthStore((state) => state.isAuthReady)
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)

  if (!isAuthReady || isAuthLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm font-medium text-[#5a645d]">
        Проверяем авторизацию...
      </div>
    )
  }

  if (!authToken) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return children
}
