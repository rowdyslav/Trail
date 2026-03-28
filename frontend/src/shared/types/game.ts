export type CheckpointStatus = 'locked' | 'available' | 'completed'
export type RouteAccessType = 'free' | 'paid'
export type RedemptionRequestStatus = 'active' | 'used' | 'expired' | 'cancelled'
export type StreakKey = 'novice' | 'explorer' | 'traveler' | 'pathfinder' | 'legend'
export type RoutePointKind = 'qr' | 'finish'
export type RoutePointState = 'visited' | 'active' | 'locked'

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

export interface RoutePoint {
  id: string
  title: string
  subtitle: string
  image: string
  latitude: number
  longitude: number
  state: RoutePointState
  kind: RoutePointKind
  activationToken: string | null
}

export interface RouteDetails {
  id: string
  city: string
  title: string
  description: string
  accessType: RouteAccessType
  priceRub: number
  priceLabel: string
  isPurchased: boolean
  isActive: boolean
  isCompleted: boolean
  currentLegLabel: string
  estimatedTime: string
  distance: string
  checkpoints: Checkpoint[]
  routePoints: RoutePoint[]
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
  rewardPointsBalance: number
  streakDays: number
  streakKey: StreakKey
  badges: Badge[]
}
