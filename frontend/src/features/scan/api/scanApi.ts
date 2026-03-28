import { apiRequest } from '../../../shared/api/http'
import type { UserRead } from '../../auth/api/authApi'

interface PlaceRead {
  id: string
  title: string
}

export interface ScanActivationResponse {
  success: boolean
  already_scanned: boolean
  route_id: string
  route_completed: boolean
  reward_granted: boolean
  reward_points_granted: number
  user: UserRead
  place: PlaceRead
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
