import { create } from 'zustand'
import { avatarStages, mockRoute, mockUser } from '../../../entities/quest/model/mockData'
import type { Checkpoint, RouteDetails, UserProfile } from '../../../shared/types/game'

interface RewardState {
  title: string
  description: string
  xp: number
}

interface GameState {
  route: RouteDetails
  user: UserProfile
  isScanOpen: boolean
  isScanning: boolean
  activeReward: RewardState | null
  openScan: () => void
  closeScan: () => void
  startScan: () => void
  closeReward: () => void
}

const getCurrentCheckpoint = (checkpoints: Checkpoint[]) =>
  checkpoints.find((checkpoint) => checkpoint.status === 'available') ?? null

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

export const useGameStore = create<GameState>((set) => ({
  route: {
    ...mockRoute,
    progress: getRouteProgress(mockRoute.checkpoints),
  },
  user: mockUser,
  isScanOpen: false,
  isScanning: false,
  activeReward: null,
  openScan: () => set({ isScanOpen: true }),
  closeScan: () => set({ isScanOpen: false, isScanning: false }),
  closeReward: () => set({ activeReward: null }),
  startScan: () => {
    set({ isScanning: true })

    window.setTimeout(() => {
      set((state) => {
        const currentCheckpoint = getCurrentCheckpoint(state.route.checkpoints)

        if (!currentCheckpoint) {
          return {
            isScanning: false,
            isScanOpen: false,
          }
        }

        const completedRoute = state.route.checkpoints.map((checkpoint, index, checkpoints) => {
          if (checkpoint.id === currentCheckpoint.id) {
            return { ...checkpoint, status: 'completed' as const }
          }

          const previousCheckpoint = checkpoints[index - 1]

          if (checkpoint.status === 'locked' && previousCheckpoint?.id === currentCheckpoint.id) {
            return { ...checkpoint, status: 'available' as const }
          }

          return checkpoint
        })

        const nextXp = state.user.xp + currentCheckpoint.xp

        return {
          isScanning: false,
          isScanOpen: false,
          activeReward: {
            title: currentCheckpoint.reward.title,
            description: currentCheckpoint.reward.description,
            xp: currentCheckpoint.xp,
          },
          route: {
            ...state.route,
            checkpoints: completedRoute,
            progress: getRouteProgress(completedRoute),
          },
          user: {
            ...state.user,
            xp: nextXp,
            level: nextXp >= state.user.nextLevelXp ? state.user.level + 1 : state.user.level,
            avatarStage: updateAvatarStage(nextXp),
          },
        }
      })
    }, 1400)
  },
}))
