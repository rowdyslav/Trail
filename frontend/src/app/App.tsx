import { useEffect, useRef } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuthStore } from '../features/auth/model/useAuthStore'
import { useRouteProgressStore } from '../features/game/model/useRouteProgressStore'
import { useRedemptionStore } from '../features/redemption/model/useRedemptionStore'

export function App() {
  const authToken = useAuthStore((state) => state.authToken)
  const isAuthReady = useAuthStore((state) => state.isAuthReady)
  const userId = useAuthStore((state) => state.user.id)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const resetRouteState = useRouteProgressStore((state) => state.resetRouteState)
  const hydrateActiveRedemptions = useRedemptionStore((state) => state.hydrateActiveRedemptions)
  const fetchPrizeCatalog = useRedemptionStore((state) => state.fetchPrizeCatalog)
  const sessionKeyRef = useRef<string | null>(null)

  useEffect(() => {
    void (async () => {
      const profile = await initializeAuth()
      hydrateActiveRedemptions(profile)
      await fetchPrizeCatalog()
    })()
  }, [fetchPrizeCatalog, hydrateActiveRedemptions, initializeAuth])

  useEffect(() => {
    if (!isAuthReady) {
      return
    }

    const sessionKey = authToken ? userId : 'guest'

    if (sessionKeyRef.current === null) {
      sessionKeyRef.current = sessionKey
      return
    }

    if (sessionKeyRef.current !== sessionKey) {
      resetRouteState()
      sessionKeyRef.current = sessionKey
    }
  }, [authToken, isAuthReady, resetRouteState, userId])

  return <RouterProvider router={router} />
}
