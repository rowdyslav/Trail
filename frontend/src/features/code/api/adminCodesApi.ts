import { apiRequest } from '../../../shared/api/http'

export interface AdminCodeItem {
  prizeId: string
  title: string
  pointsCost: number
  quantity: number
}

export interface AdminCodeUser {
  id: string
  email: string
  streakDays: number
  rewardPoints: number
}

export interface AdminCodeValidation {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  requestedPoints: number
  createdAt: string
  user: AdminCodeUser
  items: AdminCodeItem[]
  canConfirm: boolean
}

export interface AdminCodeConfirmation {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  usedAt: string
  deductedPoints: number
  user: AdminCodeUser
  items: AdminCodeItem[]
}

interface UserRead {
  id: string
  email: string
  streak_days: number
  reward_points: number
}

interface CodePrizeItemRead {
  prize_id: string
  title: string
  points_cost: number
  quantity: number
}

interface CodeValidationRead {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  requested_points: number
  created_at: string
  user: UserRead
  items: CodePrizeItemRead[]
  can_confirm: boolean
}

interface CodeConfirmRead {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  used_at: string
  deducted_points: number
  user: UserRead
  items: CodePrizeItemRead[]
}

const mapUser = (user: UserRead): AdminCodeUser => ({
  id: user.id,
  email: user.email,
  streakDays: user.streak_days,
  rewardPoints: user.reward_points,
})

const mapItem = (item: CodePrizeItemRead): AdminCodeItem => ({
  prizeId: item.prize_id,
  title: item.title,
  pointsCost: item.points_cost,
  quantity: item.quantity,
})

export const adminCodesApi = {
  readByCode: async (code: string, token: string): Promise<AdminCodeValidation> => {
    const result = await apiRequest<CodeValidationRead>(`/admin/codes/${encodeURIComponent(code)}`, {
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
  confirmByCode: async (code: string, token: string): Promise<AdminCodeConfirmation> => {
    const result = await apiRequest<CodeConfirmRead>(`/admin/codes/${encodeURIComponent(code)}`, {
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

