import { apiRequest } from '../../../shared/api/http'
import type { StreakKey } from '../../../shared/types/game'

interface ScanRouteRead {
  id: string
  title: string
  current_route_id?: string | null
}

interface ScanPointRead {
  id: string
  title: string
}

interface ScanStreakRead {
  days: number
  changed: boolean
}

interface ScanAvatarRead {
  state: StreakKey
  changed: boolean
}

interface ScanRouteProgressRead {
  completed_points: number
  total_points: number
  is_completed: boolean
}

interface ScanRewardPointsRead {
  scan_gained: number
  completion_bonus_gained: number
  total_balance: number
}

interface ScanAIRead {
  fact: string
  fallback: boolean
}

export interface ScanActivationResponse {
  status: string
  message: string
  route: ScanRouteRead
  point: ScanPointRead
  streak: ScanStreakRead
  avatar: ScanAvatarRead
  route_progress: ScanRouteProgressRead
  reward_points: ScanRewardPointsRead
  ai: ScanAIRead
  completed_at?: string | null
}

export const scanApi = {
  activate: (token: string, qrCodeValue: string) =>
    apiRequest<ScanActivationResponse>('/scan', {
      method: 'POST',
      token,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qr_code_value: qrCodeValue,
      }),
    }),
}
