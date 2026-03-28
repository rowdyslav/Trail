import { handleExpiredSession } from '../lib/sessionExpiration'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

interface RequestOptions extends RequestInit {
  token?: string | null
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const getErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as { detail?: string }
    return data.detail ?? `Ошибка запроса (${response.status})`
  } catch {
    return `Ошибка запроса (${response.status})`
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...init } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401 && token) {
      handleExpiredSession(path)
    }

    throw new ApiError(await getErrorMessage(response), response.status)
  }

  return (await response.json()) as T
}

export { API_BASE_URL }
