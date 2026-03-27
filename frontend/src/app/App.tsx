import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useGameStore } from '../features/game/model/useGameStore'

export function App() {
  const initializeAuth = useGameStore((state) => state.initializeAuth)

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  return <RouterProvider router={router} />
}
