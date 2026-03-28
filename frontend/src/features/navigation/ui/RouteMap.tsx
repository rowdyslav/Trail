import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MdOpenInNew, MdRefresh } from 'react-icons/md'
import { useCurrentGeolocation } from '../../../shared/lib/useCurrentGeolocation'
import {
  DEFAULT_NAVIGATION_DESTINATION,
  RoutePointId,
  routePoints,
} from '../model/routePoints'

interface RouteMapProps {
  destinationId?: RoutePointId
}

function createMarkerIcon(kind: 'current' | 'finish') {
  const iconClass = kind === 'current' ? 'map-pin-current' : 'map-pin-finish'

  return L.divIcon({
    className: 'map-pin-wrapper',
    html: `<div class="${iconClass}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  })
}

function FitRouteBounds({ points }: { points: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] })
    }
  }, [map, points])

  return null
}

function RemoveLeafletPrefix() {
  const map = useMap()

  useEffect(() => {
    map.attributionControl.setPrefix(false)
  }, [map])

  return null
}

function normalizeRouteCoordinates(
  coordinates: [number, number][],
  fallbackStart: [number, number],
  fallbackEnd: [number, number],
) {
  if (coordinates.length > 1) {
    return coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])
  }

  return [fallbackStart, fallbackEnd]
}

export function RouteMap({ destinationId = DEFAULT_NAVIGATION_DESTINATION }: RouteMapProps) {
  const { coordinates, error, isLoading, refresh } = useCurrentGeolocation({
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 60000,
  })

  const routeStart = routePoints[RoutePointId.RouteStart]
  const destination = routePoints[destinationId]

  const [routePath, setRoutePath] = useState<[number, number][]>([
    [routeStart.latitude, routeStart.longitude],
    [destination.latitude, destination.longitude],
  ])
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isRouteLoading, setIsRouteLoading] = useState(true)

  const currentPoint = coordinates ?? routeStart
  const currentLatitude = currentPoint.latitude
  const currentLongitude = currentPoint.longitude
  const destinationLatitude = destination.latitude
  const destinationLongitude = destination.longitude
  const currentLatLng: [number, number] = [currentLatitude, currentLongitude]
  const destinationLatLng: [number, number] = [destinationLatitude, destinationLongitude]

  useEffect(() => {
    const controller = new AbortController()

    async function loadRoute() {
      setIsRouteLoading(true)
      setRouteError(null)

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${currentLongitude},${currentLatitude};${destinationLongitude},${destinationLatitude}?overview=full&geometries=geojson`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Не удалось построить маршрут')
        }

        const data = (await response.json()) as {
          routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>
        }

        const geometry = data.routes?.[0]?.geometry?.coordinates ?? []
        setRoutePath(
          normalizeRouteCoordinates(
            geometry,
            [currentLatitude, currentLongitude],
            [destinationLatitude, destinationLongitude],
          ),
        )
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setRoutePath([
          [currentLatitude, currentLongitude],
          [destinationLatitude, destinationLongitude],
        ])
        setRouteError('Не удалось загрузить маршрут по дорогам, показан упрощенный путь.')
      } finally {
        if (!controller.signal.aborted) {
          setIsRouteLoading(false)
        }
      }
    }

    void loadRoute()

    return () => controller.abort()
  }, [currentLatitude, currentLongitude, destinationLatitude, destinationLongitude])

  const currentIcon = useMemo(() => createMarkerIcon('current'), [])
  const finishIcon = useMemo(() => createMarkerIcon('finish'), [])

  const openStreetMapLink = coordinates
    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${coordinates.latitude}%2C${coordinates.longitude}%3B${destinationLatitude}%2C${destinationLongitude}`
    : `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${routeStart.latitude}%2C${routeStart.longitude}%3B${destinationLatitude}%2C${destinationLongitude}`

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#bfc9c1]/20 bg-white shadow-[0_20px_50px_rgba(15,82,56,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#edeeea] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0f5238]">Навигация</p>
          <h2 className="text-xl font-extrabold tracking-tight text-[#1a1c1a]">Живая карта маршрута</h2>
        </div>

        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f3f4f0] px-4 py-2 text-sm font-semibold text-[#1a1c1a] transition-colors hover:bg-[#e7e9e5]"
          >
            <MdRefresh className={isLoading || isRouteLoading ? 'animate-spin' : ''} />
            Обновить
          </button>
          <a
            href={openStreetMapLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0f5238] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <MdOpenInNew />
            Открыть
          </a>
        </div>
      </div>

      <div className="h-[360px] w-full bg-[#e7efe9]">
        {isRouteLoading ? (
          <div className="flex h-full w-full flex-col justify-end bg-[radial-gradient(circle_at_top,#eef8ef,transparent_55%),linear-gradient(180deg,#eef5ef_0%,#dfe9e1_100%)] p-6">
            <div className="mb-14 flex justify-center">
              <div className="relative h-40 w-40">
                <div className="absolute inset-0 animate-pulse rounded-full border-2 border-dashed border-[#0f5238]/20" />
                <div className="absolute inset-6 rounded-[2rem] bg-white/25 blur-xl" />
                <div className="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 animate-pulse rounded-full bg-[#0f5238]/30" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#1a1c1a]">Подготавливаем карту и строим маршрут по дорогам</p>
              <p className="text-sm text-[#5a645d]">Карта появится сразу после загрузки маршрута.</p>
            </div>
          </div>
        ) : (
          <MapContainer center={currentLatLng} zoom={16} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <RemoveLeafletPrefix />
            <Polyline positions={routePath} pathOptions={{ color: '#0f5238', weight: 5, opacity: 0.85 }} />
            <Marker position={currentLatLng} icon={currentIcon}>
              <Popup>Текущее местоположение</Popup>
            </Marker>
            <Marker position={destinationLatLng} icon={finishIcon}>
              <Popup>{destination.label}</Popup>
            </Marker>
            <FitRouteBounds points={routePath} />
          </MapContainer>
        )}
      </div>

      <div className="border-t border-[#edeeea] bg-[#f8faf7] px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1a] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="map-legend-dot map-legend-dot-current" />
              {coordinates ? 'Вы' : routeStart.label}
            </span>
          </div>
          <div className="rounded-full bg-[#0f5238] px-4 py-2 text-sm font-semibold text-white shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="map-legend-dot map-legend-dot-finish" />
              Финиш: {destination.label}
            </span>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1a] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full bg-[#0f5238]" />
              Маршрут
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
        <div className="text-[#404943]">
          {coordinates
            ? `Текущие координаты: ${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
            : 'Разрешите геолокацию, чтобы карта строила путь от вашего устройства.'}
        </div>
        {routeError ? <div className="font-medium text-[#9b4232]">{routeError}</div> : null}
        {!routeError && error ? <div className="font-medium text-[#9b4232]">{error}</div> : null}
      </div>
    </section>
  )
}
