import { useEffect, useState } from 'react'
import { ApiError } from '../../../shared/api/http'
import { scanApi, type ScanActivationResponse } from '../api/scanApi'

export type ActivationState = 'loading' | 'success' | 'duplicate' | 'invalid' | 'unauthorized' | 'error'

interface ActivationResult {
  state: Exclude<ActivationState, 'invalid' | 'unauthorized'>
  data: ScanActivationResponse | null
  error: string | null
}

const DEFAULT_ERROR = 'Не удалось активировать точку. Попробуйте ещё раз.'

const mapApiError = (error: unknown): Pick<ActivationResult, 'state' | 'error'> => {
  if (error instanceof ApiError) {
    if (error.status === 404 || error.status === 422) {
      return { state: 'error', error: error.message || 'Токен точки не найден или уже недействителен.' }
    }

    return { state: 'error', error: error.message || DEFAULT_ERROR }
  }

  return {
    state: 'error',
    error: error instanceof Error ? error.message : DEFAULT_ERROR,
  }
}

export function useActivatePoint({ token, authToken, enabled }: { token: string; authToken: string; enabled: boolean }) {
  const [result, setResult] = useState<ActivationResult>({
    state: 'loading',
    data: null,
    error: null,
  })
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let isCancelled = false

    const activate = async () => {
      setResult({ state: 'loading', data: null, error: null })

      try {
        const response = await scanApi.activate(authToken, token)

        if (isCancelled) {
          return
        }

        setResult({
          state: response.already_scanned ? 'duplicate' : 'success',
          data: response,
          error: null,
        })
      } catch (error) {
        if (isCancelled) {
          return
        }

        setResult({
          ...mapApiError(error),
          data: null,
        })
      }
    }

    void activate()

    return () => {
      isCancelled = true
    }
  }, [authToken, enabled, requestKey, token])

  return {
    ...result,
    retry: () => setRequestKey((value) => value + 1),
  }
}
