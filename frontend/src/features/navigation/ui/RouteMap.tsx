import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MdOpenInNew, MdRefresh } from 'react-icons/md'
import { useRouteProgressStore } from '../../game/model/useRouteProgressStore'
import { useCurrentGeolocation } from '../../../shared/lib/useCurrentGeolocation'

type MapPosition = [number, number]

const DEFAULT_CENTER: MapPosition = [54.6299, 39.7416]

function createMarkerIcon(kind: 'current' | 'start' | 'qr' | 'finish') {
  const iconClass =
    kind === 'current'
      ? 'map-pin-current'
      : kind === 'start'
        ? 'map-pin-start'
        : kind === 'qr'
          ? 'map-pin-qr'
          : 'map-pin-finish'

  return L.divIcon({
    className: 'map-pin-wrapper',
    html: `<div class="${iconClass}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  })
}

function FitRouteBounds({ points, fallbackCenter }: { points: MapPosition[]; fallbackCenter: MapPosition }) {
  const map = useMap()

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] })
      return
    }

    if (points.length === 1) {
      map.setView(points[0], 16)
      return
    }

    map.setView(fallbackCenter, 13)
  }, [fallbackCenter, map, points])

  return null
}

function RemoveLeafletPrefix() {
  const map = useMap()

  useEffect(() => {
    map.attributionControl.setPrefix(false)
  }, [map])

  return null
}

const toMapPosition = (latitude: number, longitude: number): MapPosition => [latitude, longitude]

const normalizeRouteCoordinates = (coordinates: [number, number][]) =>
  coordinates.map(([longitude, latitude]) => [latitude, longitude] as MapPosition)

const getFallbackPath = (waypoints: MapPosition[]) => waypoints

const getRouteLink = (positions: MapPosition[]) => {
  if (positions.length < 2) {
    return 'https://www.openstreetmap.org'
  }

  const start = positions[0]
  const finish = positions[positions.length - 1]

  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${start[0]}%2C${start[1]}%3B${finish[0]}%2C${finish[1]}`
}

interface RouteMapProps {
  actions?: ReactNode
}

export function RouteMap({ actions }: RouteMapProps) {
  const route = useRouteProgressStore((state) => state.route)
  const { coordinates, error, isLoading, refresh } = useCurrentGeolocation({
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 60000,
  })

  const [routePath, setRoutePath] = useState<MapPosition[]>([])
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isRouteLoading, setIsRouteLoading] = useState(true)

  const currentLatLng = useMemo(
    () => (coordinates ? toMapPosition(coordinates.latitude, coordinates.longitude) : null),
    [coordinates],
  )

  const routePointPositions = useMemo(
    () => route.routePoints.map((routePoint) => toMapPosition(routePoint.latitude, routePoint.longitude)),
    [route.routePoints],
  )

  const routingWaypoints = useMemo(() => routePointPositions, [routePointPositions])

  const boundsPoints = useMemo(
    () => (routePointPositions.length ? routePointPositions : currentLatLng ? [currentLatLng] : []),
    [currentLatLng, routePointPositions],
  )

  const mapCenter = useMemo(
    () => routePointPositions[0] ?? currentLatLng ?? DEFAULT_CENTER,
    [currentLatLng, routePointPositions],
  )

  const finishPoint = route.routePoints[route.routePoints.length - 1] ?? null

  useEffect(() => {
    const controller = new AbortController()

    async function loadRoute() {
      setRouteError(null)

      if (routingWaypoints.length === 0) {
        setRoutePath([])
        setIsRouteLoading(false)
        return
      }

      if (routingWaypoints.length === 1) {
        setRoutePath(routingWaypoints)
        setIsRouteLoading(false)
        return
      }

      setIsRouteLoading(true)

      try {
        const waypointQuery = routingWaypoints.map(([latitude, longitude]) => `${longitude},${latitude}`).join(';')
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/foot/${waypointQuery}?overview=full&geometries=geojson`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Не удалось построить маршрут')
        }

        const data = (await response.json()) as {
          routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>
        }

        const geometry = data.routes?.[0]?.geometry?.coordinates ?? []

        if (geometry.length < 2) {
          throw new Error('Маршрут вернул неполную геометрию')
        }

        setRoutePath(normalizeRouteCoordinates(geometry))
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setRoutePath(getFallbackPath(routingWaypoints))
        setRouteError('Не удалось построить путь по дорогам. Показана упрощённая линия маршрута.')
      } finally {
        if (!controller.signal.aborted) {
          setIsRouteLoading(false)
        }
      }
    }

    void loadRoute()

    return () => controller.abort()
  }, [routingWaypoints])

  const currentIcon = useMemo(() => createMarkerIcon('current'), [])
  const startIcon = useMemo(() => createMarkerIcon('start'), [])
  const qrIcon = useMemo(() => createMarkerIcon('qr'), [])
  const finishIcon = useMemo(() => createMarkerIcon('finish'), [])
  const openStreetMapLink = useMemo(() => getRouteLink(routingWaypoints), [routingWaypoints])

  return (
    <section className="route-map-shell relative z-0 overflow-hidden rounded-[28px] border border-[#bfc9c1]/20 bg-white shadow-[0_20px_50px_rgba(15,82,56,0.08)]">
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

      {actions ? (
        <div className="border-b border-[#edeeea] bg-[#f8faf7] px-5 py-4">
          <div className="flex flex-wrap gap-3">{actions}</div>
        </div>
      ) : null}

      <div className="relative z-0 h-[360px] w-full bg-[#e7efe9]">
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
              <p className="text-sm font-semibold text-[#1a1c1a]">Подготавливаем карту и строим маршрут по точкам</p>
              <p className="text-sm text-[#5a645d]">Карта появится сразу после загрузки выбранного маршрута.</p>
            </div>
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={16} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <RemoveLeafletPrefix />
            {routePath.length > 1 ? (
              <Polyline positions={routePath} pathOptions={{ color: '#0f5238', weight: 5, opacity: 0.85 }} />
            ) : null}
            {currentLatLng ? (
              <Marker position={currentLatLng} icon={currentIcon}>
                <Popup>Текущее местоположение</Popup>
              </Marker>
            ) : null}
            {route.routePoints.map((routePoint, index) => {
              const lastIndex = route.routePoints.length - 1
              const isFirstPoint = index === 0
              const isLastPoint = index === lastIndex

              return (
                <Marker
                  key={routePoint.id}
                  position={toMapPosition(routePoint.latitude, routePoint.longitude)}
                  icon={isLastPoint ? finishIcon : isFirstPoint ? startIcon : qrIcon}
                >
                  <Popup minWidth={170} maxWidth={190}>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5a645d]">
                          {isLastPoint ? 'Финиш маршрута' : isFirstPoint ? 'Стартовая точка' : 'Точка маршрута'}
                        </p>
                        <h3 className="mt-1 text-sm font-bold text-[#1a1c1a]">{routePoint.title}</h3>
                        <p className="mt-1 text-xs text-[#404943]">{routePoint.subtitle}</p>
                      </div>
                      {isLastPoint ? (
                        <div className="rounded-2xl bg-[#f3f4f0] px-3 py-2 text-xs text-[#404943]">
                          Эта точка завершает маршрут.
                        </div>
                      ) : (
                        <div className="rounded-2xl bg-[#f3f4f0] px-3 py-2 text-xs text-[#404943]">
                          Для активации этой точки откройте физический QR-код на локации.
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            })}
            <FitRouteBounds points={boundsPoints} fallbackCenter={mapCenter} />
          </MapContainer>
        )}
      </div>

      <div className="border-t border-[#edeeea] bg-[#f8faf7] px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1a] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="map-legend-dot map-legend-dot-current" />
              {coordinates ? 'Вы' : 'Текущая позиция'}
            </span>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1a] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="map-legend-dot map-legend-dot-start" />
              Старт
            </span>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1a1c1a] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="map-legend-dot map-legend-dot-qr" />
              Точки
            </span>
          </div>
          {finishPoint ? (
            <div className="rounded-full bg-[#0f5238] px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <span className="inline-flex items-center gap-2">
                <span className="map-legend-dot map-legend-dot-finish" />
                Финиш: {finishPoint.title}
              </span>
            </div>
          ) : null}
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
            : 'Разрешите геолокацию, чтобы видеть своё местоположение рядом с маршрутом.'}
        </div>
        {routeError ? <div className="font-medium text-[#9b4232]">{routeError}</div> : null}
        {!routeError && error ? <div className="font-medium text-[#9b4232]">{error}</div> : null}
      </div>
    </section>
  )
}
