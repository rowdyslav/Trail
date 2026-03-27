export type CheckpointStatus = 'locked' | 'available' | 'completed'
export type RouteAccessType = 'free' | 'paid'
export type RedemptionRequestStatus = 'active' | 'used' | 'expired' | 'cancelled'

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

export interface PrizeCatalogItem {
  id: string
  title: string
  description: string
  pointsCost: number
  isActive?: boolean
  image?: string
}

export interface RedemptionDraftItem {
  prizeId: string
  quantity: number
}

export interface RedemptionRequestItem {
  prizeId: string
  titleSnapshot: string
  pointsCostSnapshot: number
  quantity: number
  totalPoints: number
}

export interface RedemptionRequest {
  id: string
  code: string
  status: RedemptionRequestStatus
  userId: string
  userName: string
  createdAt: string
  issuedAt?: string
  totalPoints: number
  items: RedemptionRequestItem[]
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
