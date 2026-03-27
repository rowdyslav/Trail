import { apiRequest } from '../../../shared/api/http'

export interface AdminRedemptionItem {
  prizeId: string
  title: string
  pointsCost: number
  quantity: number
}

export interface AdminRedemptionUser {
  id: string
  email: string
  streakDays: number
  rewardPoints: number
}

export interface AdminRedemptionValidation {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  requestedPoints: number
  createdAt: string
  user: AdminRedemptionUser
  items: AdminRedemptionItem[]
  canConfirm: boolean
}

export interface AdminRedemptionConfirmation {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  usedAt: string
  deductedPoints: number
  user: AdminRedemptionUser
  items: AdminRedemptionItem[]
}

interface UserRead {
  id: string
  email: string
  streak_days: number
  reward_points: number
}

interface RedemptionPrizeItemRead {
  prize_id: string
  title: string
  points_cost: number
  quantity: number
}

interface RedemptionValidationRead {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  requested_points: number
  created_at: string
  user: UserRead
  items: RedemptionPrizeItemRead[]
  can_confirm: boolean
}

interface RedemptionConfirmRead {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  used_at: string
  deducted_points: number
  user: UserRead
  items: RedemptionPrizeItemRead[]
}

const mapUser = (user: UserRead): AdminRedemptionUser => ({
  id: user.id,
  email: user.email,
  streakDays: user.streak_days,
  rewardPoints: user.reward_points,
})

const mapItem = (item: RedemptionPrizeItemRead): AdminRedemptionItem => ({
  prizeId: item.prize_id,
  title: item.title,
  pointsCost: item.points_cost,
  quantity: item.quantity,
})

export const adminRedemptionsApi = {
  readByCode: async (code: string, token: string): Promise<AdminRedemptionValidation> => {
    const result = await apiRequest<RedemptionValidationRead>(`/admin/redemptions/${encodeURIComponent(code)}`, {
      method: 'GET',
      token,
    })

    return {
      code: result.code,
      status: result.status,
      requestedPoints: result.requested_points,
      createdAt: result.created_at,
      user: mapUser(result.user),
      items: result.items.map(mapItem),
      canConfirm: result.can_confirm,
    }
  },
  confirmByCode: async (code: string, token: string): Promise<AdminRedemptionConfirmation> => {
    const result = await apiRequest<RedemptionConfirmRead>(`/admin/redemptions/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      token,
    })

    return {
      code: result.code,
      status: result.status,
      usedAt: result.used_at,
      deductedPoints: result.deducted_points,
      user: mapUser(result.user),
      items: result.items.map(mapItem),
    }
  },
}

