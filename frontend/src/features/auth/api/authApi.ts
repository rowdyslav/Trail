import { apiRequest } from '../../../shared/api/http'
import type { PaymentRead } from '../../navigation/api/routesApi'

interface BearerToken {
  access_token: string
}

interface UserRead {
  id: string
  email: string
  streak_days: number
  streak_key: 'novice' | 'explorer' | 'traveler' | 'pathfinder' | 'legend'
  reward_points: number
  active_route_id?: string | null
  purchased_route_ids?: string[]
}

interface RedemptionPrizeItemRead {
  prize_id: string
  title: string
  points_cost: number
  quantity: number
}

interface RedemptionCodeRead {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  requested_points: number
  created_at: string
  used_at?: string | null
  cancelled_at?: string | null
  items: RedemptionPrizeItemRead[]
}

interface UserProfileRead extends UserRead {
  active_redemptions?: RedemptionCodeRead[]
  payments?: PaymentRead[]
}

const createFormBody = (fields: Record<string, string>) => {
  const body = new URLSearchParams()

  Object.entries(fields).forEach(([key, value]) => {
    body.set(key, value)
  })

  return body
}

export const authApi = {
  register: (email: string, password: string) =>
    apiRequest<BearerToken>('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }),
  login: (email: string, password: string) =>
    apiRequest<BearerToken>('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: createFormBody({
        username: email,
        password,
      }),
    }),
  readMe: (token: string) =>
    apiRequest<UserProfileRead>('/me', {
      method: 'GET',
      token,
    }),
}

export type { PaymentRead, RedemptionCodeRead, UserProfileRead, UserRead }
