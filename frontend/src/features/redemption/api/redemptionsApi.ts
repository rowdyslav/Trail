import { apiRequest } from '../../../shared/api/http'
import type { RedemptionRequest } from '../../../shared/types/game'

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

interface RedemptionPrizeSelection {
  prize_id: string
  quantity: number
}

const mapStatus = (status: RedemptionCodeRead['status']): RedemptionRequest['status'] => status

export const mapRedemptionCodeRead = (payload: RedemptionCodeRead): RedemptionRequest => ({
  id: payload.code,
  code: payload.code,
  status: mapStatus(payload.status),
  userId: '',
  userName: '',
  createdAt: payload.created_at,
  issuedAt: payload.used_at ?? undefined,
  totalPoints: payload.requested_points,
  items: payload.items.map((item) => ({
    prizeId: item.prize_id,
    titleSnapshot: item.title,
    pointsCostSnapshot: item.points_cost,
    quantity: item.quantity,
    totalPoints: item.points_cost * item.quantity,
  })),
})

export const redemptionsApi = {
  create: async (token: string, items: RedemptionPrizeSelection[]) => {
    const result = await apiRequest<RedemptionCodeRead>('/redemptions', {
      method: 'POST',
      token,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    })

    return mapRedemptionCodeRead(result)
  },
  readByCode: async (token: string, code: string) => {
    const result = await apiRequest<RedemptionCodeRead>(`/redemptions/${encodeURIComponent(code)}`, {
      method: 'GET',
      token,
    })

    return mapRedemptionCodeRead(result)
  },
}
