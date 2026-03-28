import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuthStore } from '../features/auth/model/useAuthStore'
import { useRedemptionStore } from '../features/redemption/model/useRedemptionStore'

export function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const hydrateActiveRedemptions = useRedemptionStore((state) => state.hydrateActiveRedemptions)
  const fetchPrizeCatalog = useRedemptionStore((state) => state.fetchPrizeCatalog)

  useEffect(() => {
    void (async () => {
      const profile = await initializeAuth()
      hydrateActiveRedemptions(profile)
      await fetchPrizeCatalog()
    })()
  }, [fetchPrizeCatalog, hydrateActiveRedemptions, initializeAuth])

  return <RouterProvider router={router} />
}
