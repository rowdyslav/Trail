import { create } from 'zustand'
import { avatarStages, catalogRoutes, mockRoute } from '../../../entities/quest/model/mockData'
import { getCurrentCheckpoint, matchesCheckpointQr } from '../../scan/model/qrPayload'
import { useAuthStore } from '../../auth/model/useAuthStore'
import { useRewardStore } from '../../rewards/model/useRewardStore'
import { useScanUiStore } from '../../scan/model/useScanUiStore'
import type { CatalogRoute, Checkpoint, RouteDetails } from '../../../shared/types/game'

interface RouteProgressState {
  route: RouteDetails
  catalogRoutes: CatalogRoute[]
  completeScan: (value: string) => { success: boolean; error?: string }
}

const getRouteProgress = (checkpoints: Checkpoint[]) => {
  const completedCount = checkpoints.filter((checkpoint) => checkpoint.status === 'completed').length
  return Math.round((completedCount / checkpoints.length) * 100)
}

const updateAvatarStage = (xp: number) => {
  if (xp >= 1600) return avatarStages[3].id
  if (xp >= 1200) return avatarStages[2].id
  if (xp >= 800) return avatarStages[1].id
  return avatarStages[0].id
}

export const useRouteProgressStore = create<RouteProgressState>((set, get) => ({
  route: {
    ...mockRoute,
    progress: getRouteProgress(mockRoute.checkpoints),
  },
  catalogRoutes,
  completeScan: (value) => {
    const state = get()
    const currentCheckpoint = getCurrentCheckpoint(state.route.checkpoints)

    if (!currentCheckpoint) {
      useScanUiStore.getState().closeScan()
      return { success: false, error: 'Route is already completed.' }
    }

    if (!matchesCheckpointQr(value, currentCheckpoint.id)) {
      useScanUiStore.getState().setScanning(false)
      return { success: false, error: 'This QR code does not match the current checkpoint.' }
    }

    let rewardPayload: { title: string; description: string; xp: number } | null = null

    set((currentState) => {
      const activeCheckpoint = getCurrentCheckpoint(currentState.route.checkpoints)

      if (!activeCheckpoint) {
        useScanUiStore.getState().closeScan()
        return currentState
      }

      const completedRoute = currentState.route.checkpoints.map((checkpoint, index, checkpoints) => {
        if (checkpoint.id === activeCheckpoint.id) {
          return { ...checkpoint, status: 'completed' as const }
        }

        const previousCheckpoint = checkpoints[index - 1]

        if (checkpoint.status === 'locked' && previousCheckpoint?.id === activeCheckpoint.id) {
          return { ...checkpoint, status: 'available' as const }
        }

        return checkpoint
      })

      const authStore = useAuthStore.getState()
      const nextXp = authStore.user.xp + activeCheckpoint.xp
      const nextPoints = authStore.user.rewardPointsBalance + Math.round(activeCheckpoint.xp * 0.4)

      authStore.updateUser((user) => ({
        ...user,
        xp: nextXp,
        rewardPointsBalance: nextPoints,
        level: nextXp >= user.nextLevelXp ? user.level + 1 : user.level,
        avatarStage: updateAvatarStage(nextXp),
      }))

      rewardPayload = {
        title: activeCheckpoint.reward.title,
        description: activeCheckpoint.reward.description,
        xp: activeCheckpoint.xp,
      }

      return {
        route: {
          ...currentState.route,
          checkpoints: completedRoute,
          progress: getRouteProgress(completedRoute),
        },
      }
    })

    useScanUiStore.getState().closeScan()

    if (rewardPayload) {
      useRewardStore.getState().showReward(rewardPayload)
    }

    return { success: true }
  },
}))
