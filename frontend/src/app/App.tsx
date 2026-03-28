import { useEffect, useRef } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuthStore } from '../features/auth/model/useAuthStore'
import { useRouteProgressStore } from '../features/game/model/useRouteProgressStore'
import { useCodeStore } from '../features/code/model/useCodeStore'

export function App() {
  const authToken = useAuthStore((state) => state.authToken)
  const isAuthReady = useAuthStore((state) => state.isAuthReady)
  const userId = useAuthStore((state) => state.user.id)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const resetRouteState = useRouteProgressStore((state) => state.resetRouteState)
  const syncRouteStateFromProfile = useRouteProgressStore((state) => state.syncRouteStateFromProfile)
  const hydrateActiveCodes = useCodeStore((state) => state.hydrateActiveCodes)
  const fetchPrizeCatalog = useCodeStore((state) => state.fetchPrizeCatalog)
  const sessionKeyRef = useRef<string | null>(null)

  useEffect(() => {
    void (async () => {
      const profile = await initializeAuth()
      hydrateActiveCodes(profile)

      if (profile) {
        await syncRouteStateFromProfile()
      }

      await fetchPrizeCatalog()
    })()
  }, [fetchPrizeCatalog, hydrateActiveCodes, initializeAuth, syncRouteStateFromProfile])

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

      if (authToken) {
        void syncRouteStateFromProfile()
      }
    }
  }, [authToken, isAuthReady, resetRouteState, syncRouteStateFromProfile, userId])

  return <RouterProvider router={router} />
}
