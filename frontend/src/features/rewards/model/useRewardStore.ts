import { create } from 'zustand'

export interface RewardState {
  title: string
  description: string
  xp: number
}

interface RewardStoreState {
  activeReward: RewardState | null
  showReward: (reward: RewardState) => void
  closeReward: () => void
}

export const useRewardStore = create<RewardStoreState>((set) => ({
  activeReward: null,
  showReward: (reward) => set({ activeReward: reward }),
  closeReward: () => set({ activeReward: null }),
}))
