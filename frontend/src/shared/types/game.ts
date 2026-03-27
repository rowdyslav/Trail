export type CheckpointStatus = 'locked' | 'available' | 'completed'
export type RouteAccessType = 'free' | 'paid'
export type RedemptionRequestStatus = 'created' | 'issued'
export type RedemptionRequestKind = 'reward' | 'custom_amount'

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

export interface CatalogRoute {
  id: string
  city: string
  title: string
  description: string
  distanceLabel: string
  durationLabel: string
  image: string
  accessType: RouteAccessType
  priceLabel?: string
  pricePoints?: number
  purchased?: boolean
  isActive?: boolean
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

export interface RewardOption {
  id: string
  title: string
  description: string
  pointsCost: number
}

export interface RedemptionRequest {
  id: string
  code: string
  status: RedemptionRequestStatus
  kind: RedemptionRequestKind
  userName: string
  createdAt: string
  preferredRewardId?: string
  preferredPointsAmount?: number
  issuedRewardId?: string
  issuedPointsAmount?: number
  confirmedAt?: string
}

export interface UserProfile {
  id: string
  email?: string
  name: string
  title: string
  level: number
  xp: number
  rewardPointsBalance: number
  streakDays: number
  nextLevelXp: number
  avatarStage: number
  badges: Badge[]
}
