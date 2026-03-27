import { useCallback, useEffect, useState } from 'react'

interface Coordinates {
  latitude: number
  longitude: number
  accuracy: number
}

interface UseCurrentGeolocationOptions extends PositionOptions {
  enabled?: boolean
}

interface UseCurrentGeolocationResult {
  coordinates: Coordinates | null
  error: string | null
  isLoading: boolean
  refresh: () => void
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

export function useCurrentGeolocation(
  options: UseCurrentGeolocationOptions = {},
): UseCurrentGeolocationResult {
  const {
    enabled = true,
    enableHighAccuracy = DEFAULT_OPTIONS.enableHighAccuracy,
    timeout = DEFAULT_OPTIONS.timeout,
    maximumAge = DEFAULT_OPTIONS.maximumAge,
  } = options

  const isGeolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(enabled && isGeolocationSupported)
  const [requestVersion, setRequestVersion] = useState(0)

  const refresh = useCallback(() => {
    if (!enabled || !isGeolocationSupported) {
      return
    }

    setIsLoading(true)
    setError(null)
    setRequestVersion((value) => value + 1)
  }, [enabled, isGeolocationSupported])

  useEffect(() => {
    if (!enabled || !isGeolocationSupported) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setError(null)
        setIsLoading(false)
      },
      (positionError) => {
        const message =
          positionError.code === positionError.PERMISSION_DENIED
            ? 'Доступ к геолокации запрещен'
            : positionError.code === positionError.POSITION_UNAVAILABLE
              ? 'Не удалось определить местоположение'
              : 'Время ожидания геолокации истекло'

        setCoordinates(null)
        setError(message)
        setIsLoading(false)
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      },
    )
  }, [enableHighAccuracy, enabled, isGeolocationSupported, maximumAge, requestVersion, timeout])

  return {
    coordinates,
    error: !isGeolocationSupported ? 'Геолокация не поддерживается на этом устройстве' : error,
    isLoading: enabled && isGeolocationSupported ? isLoading : false,
    refresh,
  }
}
