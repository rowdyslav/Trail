import { apiRequest } from '../../../shared/api/http'

interface BearerToken {
  access_token: string
}

interface UserRead {
  id: string
  email: string
  streak_days: number
  streak_key: 'novice' | 'explorer' | 'traveler' | 'pathfinder' | 'legend'
  reward_points: number
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
    apiRequest<UserRead>('/me', {
      method: 'GET',
      token,
    }),
}

export type { UserRead }
