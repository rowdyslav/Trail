export type CheckpointStatus = 'locked' | 'available' | 'completed'

export interface Reward {
  title: string
  description: string
}

export interface Checkpoint {
  id: string
  title: string
  subtitle: string
  hint: string
  storyBeat: string
  xp: number
  status: CheckpointStatus
  reward: Reward
}

export interface RouteDetails {
  id: string
  city: string
  title: string
  description: string
  currentLegLabel: string
  estimatedTime: string
  distance: string
  checkpoints: Checkpoint[]
  progress: number
}

export interface Badge {
  id: string
  title: string
  tone: string
}

export interface DailyMission {
  id: string
  title: string
  subtitle: string
  accent: string
  icon: string
}

export interface SuggestedRoute {
  id: string
  title: string
  distanceLabel: string
  image: string
}

export interface Landmark {
  id: string
  title: string
  subtitle: string
  image: string
  state: 'visited' | 'active' | 'locked'
}

export interface ProfileStat {
  id: string
  label: string
  value: string
  icon: string
}

export interface UpgradeItem {
  id: string
  title: string
  icon: string
  tone: string
  locked?: boolean
}

export interface UserProfile {
  name: string
  title: string
  level: number
  xp: number
  streakDays: number
  nextLevelXp: number
  avatarStage: number
  badges: Badge[]
}
