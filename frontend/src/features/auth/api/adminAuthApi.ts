import { apiRequest } from '../../../shared/api/http'

interface BearerToken {
  access_token: string
}

export const adminAuthApi = {
  login: (email: string, password: string) =>
    apiRequest<BearerToken>('/admin/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }),
}

