import { apiRequest } from '../../../shared/api/http'
import type { CodeRequest } from '../../../shared/types/game'

interface CodePrizeItemRead {
  prize_id: string
  title: string
  points_cost: number
  quantity: number
}

interface CodeRead {
  code: string
  status: 'active' | 'used' | 'expired' | 'cancelled'
  requested_points: number
  created_at: string
  used_at?: string | null
  cancelled_at?: string | null
  items: CodePrizeItemRead[]
}

interface CodePrizeSelection {
  prize_id: string
  quantity: number
}

const mapStatus = (status: CodeRead['status']): CodeRequest['status'] => status

export const mapCodeRead = (payload: CodeRead): CodeRequest => ({
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

export const codesApi = {
  create: async (token: string, items: CodePrizeSelection[]) => {
    const result = await apiRequest<CodeRead>('/codes', {
      method: 'POST',
      token,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    })

    return mapCodeRead(result)
  },
  readByCode: async (token: string, code: string) => {
    const result = await apiRequest<CodeRead>(`/codes/${encodeURIComponent(code)}`, {
      method: 'GET',
      token,
    })

    return mapCodeRead(result)
  },
  cancel: async (token: string, code: string) => {
    const result = await apiRequest<CodeRead>(`/codes/${encodeURIComponent(code)}`, {
      method: 'DELETE',
      token,
    })

    return mapCodeRead(result)
  },
}
