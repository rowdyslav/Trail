import { apiRequest } from '../../../shared/api/http'
import type {
  CatalogRoute,
  Checkpoint,
  CheckpointStatus,
  RouteAccessType,
  RouteDetails,
  RoutePoint,
  RoutePointKind,
  RoutePointState,
} from '../../../shared/types/game'

interface PlaceRead {
  id: string
  title: string
  reward_points: number
  latitude: number
  longitude: number
  activation_token?: string
}

export interface RouteRead {
  id: string
  title: string
  description: string
  route_type: RouteAccessType
  reward_points_on_completion: number
  price_rub: number
  places_total: number
  places: PlaceRead[]
}

export interface RouteViewerStateRead {
  route_id: string
  is_purchased: boolean
  is_active: boolean
  is_completed: boolean
  scanned_places_count: number
}

interface RouteSelectionRead {
  route_id: string
  is_active: boolean
}

interface RoutePurchaseRequest {
  return_url: string
}

interface RoutePurchaseRead {
  route_id: string
  payment_id?: string | null
  payment_status: string
  amount_rub: number
  confirmation_url?: string | null
  purchased_at: string
  confirmed_at?: string | null
  is_confirmed: boolean
}

export interface RouteWithViewerState extends RouteRead {
  is_purchased: boolean
  is_active: boolean
  is_completed: boolean
  scanned_places_count: number
}

const routeImages: Record<RouteAccessType, string[]> = {
  free: [
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
  ],
  paid: [
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  ],
}

const getDurationLabel = (placesTotal: number) => `${Math.max(placesTotal * 12, 15)} мин`

const getDistanceLabel = (placesTotal: number) =>
  `${(Math.max(placesTotal, 1) * 0.8).toFixed(1).replace('.', ',')} км`

const getRouteImage = (accessType: RouteAccessType, index: number) => {
  const images = routeImages[accessType]
  return images[index % images.length]
}

const guessCity = (description: string) => {
  const normalized = description.toLowerCase()

  if (normalized.includes('рязань')) {
    return 'Рязань'
  }

  if (normalized.includes('константинов')) {
    return 'Константиново'
  }

  if (normalized.includes('москв')) {
    return 'Москва'
  }

  return 'Маршрут'
}

const getRoutePointKind = (index: number, total: number): RoutePointKind => (index === total - 1 ? 'finish' : 'qr')

const getRoutePointState = (route: RouteWithViewerState, index: number): RoutePointState => {
  if (route.route_type === 'paid' && !route.is_purchased) {
    return 'locked'
  }

  const scannedCount = Math.min(route.scanned_places_count, route.places.length)

  if (route.is_completed || index < scannedCount) {
    return 'visited'
  }

  if (index === scannedCount && scannedCount < route.places.length) {
    return 'active'
  }

  return 'locked'
}

const getCheckpointStatus = (state: RoutePointState): CheckpointStatus => {
  if (state === 'visited') {
    return 'completed'
  }

  if (state === 'active') {
    return 'available'
  }

  return 'locked'
}

const getRoutePointSubtitle = (kind: RoutePointKind, state: RoutePointState, index: number) => {
  if (kind === 'finish') {
    if (state === 'visited') {
      return 'Финиш пройден'
    }

    if (state === 'active') {
      return 'Финиш маршрута'
    }

    return 'Финальная точка'
  }

  if (state === 'visited') {
    return `QR-точка ${index + 1} пройдена`
  }

  if (state === 'active') {
    return 'Текущая QR-точка'
  }

  return `QR-точка ${index + 1}`
}

const mapPlaceToRoutePoint = (route: RouteWithViewerState, place: PlaceRead, index: number): RoutePoint => {
  const kind = getRoutePointKind(index, route.places.length)
  const state = getRoutePointState(route, index)

  return {
    id: place.id,
    title: place.title,
    subtitle: getRoutePointSubtitle(kind, state, index),
    image: getRouteImage(route.route_type, index),
    latitude: place.latitude,
    longitude: place.longitude,
    state,
    kind,
    activationToken: kind === 'qr' ? place.activation_token ?? null : null,
  }
}

const mapPlaceToCheckpoint = (route: RouteWithViewerState, place: PlaceRead, index: number): Checkpoint => {
  const kind = getRoutePointKind(index, route.places.length)
  const state = getRoutePointState(route, index)

  return {
    id: place.id,
    title: place.title,
    subtitle: getRoutePointSubtitle(kind, state, index),
    hint:
      kind === 'finish'
        ? 'Дойдите до финальной точки маршрута, чтобы завершить прогулку.'
        : 'Точка маршрута синхронизирована с backend и готова к активации.',
    storyBeat:
      kind === 'finish'
        ? 'Финальная точка замыкает маршрут и завершает прохождение.'
        : 'Точка маршрута синхронизирована с backend и ждёт активации.',
    xp: place.reward_points,
    status: getCheckpointStatus(state),
    reward: {
      title: kind === 'finish' ? `Финал: ${place.title}` : `Награда за ${place.title}`,
      description:
        kind === 'finish'
          ? `Завершите маршрут в точке «${place.title}» и получите финальные очки.`
          : `+${place.reward_points} очков за активацию точки.`,
    },
  }
}

const mapRouteToCatalogRoute = (route: RouteWithViewerState, index: number): CatalogRoute => ({
  id: route.id,
  city: guessCity(route.description),
  title: route.title,
  description: route.description,
  distanceLabel: getDistanceLabel(route.places_total),
  durationLabel: getDurationLabel(route.places_total),
  image: getRouteImage(route.route_type, index),
  accessType: route.route_type,
  priceLabel: route.route_type === 'free' ? 'Free' : `${route.price_rub} ₽`,
  pricePoints: undefined,
  purchased: route.is_purchased,
  isActive: route.is_active,
})

const mapRouteToRouteDetails = (route: RouteWithViewerState): RouteDetails => {
  const routePoints = route.places.map((place, index) => mapPlaceToRoutePoint(route, place, index))
  const activeRoutePoint = routePoints.find((routePoint) => routePoint.state === 'active') ?? null
  const scannedCount = Math.min(route.scanned_places_count, route.places_total)
  const isPaidPreview = route.route_type === 'paid' && !route.is_purchased

  return {
    id: route.id,
    city: guessCity(route.description),
    title: route.title,
    description: route.description,
    accessType: route.route_type,
    priceRub: route.price_rub,
    priceLabel: route.route_type === 'free' ? 'Free' : `${route.price_rub} ₽`,
    isPurchased: route.is_purchased,
    isActive: route.is_active,
    isCompleted: route.is_completed,
    currentLegLabel: route.is_completed
      ? 'Маршрут завершён'
      : isPaidPreview
        ? 'Маршрут откроется после покупки'
        : activeRoutePoint?.title ?? route.places[0]?.title ?? 'Маршрут готов к старту',
    estimatedTime: getDurationLabel(route.places_total),
    distance: getDistanceLabel(route.places_total),
    checkpoints: route.places.map((place, index) => mapPlaceToCheckpoint(route, place, index)),
    routePoints,
    progress: route.places_total > 0 ? Math.round((scannedCount / route.places_total) * 100) : 0,
  }
}

const withDefaultViewerState = (route: RouteRead): RouteWithViewerState => ({
  ...route,
  is_purchased: route.route_type === 'free',
  is_active: false,
  is_completed: false,
  scanned_places_count: 0,
})

const mergeViewerState = (route: RouteRead, state?: RouteViewerStateRead): RouteWithViewerState => {
  const fallback = withDefaultViewerState(route)

  if (!state) {
    return fallback
  }

  return {
    ...fallback,
    is_purchased: state.is_purchased || route.route_type === 'free',
    is_active: state.is_active,
    is_completed: state.is_completed,
    scanned_places_count: state.scanned_places_count,
  }
}

export const routesApi = {
  async list(routeType?: RouteAccessType | null) {
    const searchParams = new URLSearchParams()

    if (routeType) {
      searchParams.set('route_type', routeType)
    }

    const query = searchParams.toString()

    return apiRequest<RouteRead[]>(`/routes${query ? `?${query}` : ''}`, {
      method: 'GET',
    })
  },
  async read(routeId: string) {
    return apiRequest<RouteRead>(`/routes/${routeId}`, {
      method: 'GET',
    })
  },
  async listViewerStates(token: string) {
    return apiRequest<RouteViewerStateRead[]>('/routes/viewer-states', {
      method: 'GET',
      token,
    })
  },
  async readViewerState(routeId: string, token: string) {
    return apiRequest<RouteViewerStateRead>(`/routes/${routeId}/viewer-state`, {
      method: 'GET',
      token,
    })
  },
  async select(routeId: string, token: string) {
    return apiRequest<RouteSelectionRead>(`/routes/${routeId}/select`, {
      method: 'POST',
      token,
    })
  },
  async purchase(routeId: string, token: string, payload: RoutePurchaseRequest) {
    return apiRequest<RoutePurchaseRead>(`/routes/${routeId}/purchase`, {
      method: 'POST',
      token,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  },
  async confirmPurchase(routeId: string, token: string) {
    return apiRequest<RoutePurchaseRead>(`/routes/${routeId}/purchase/confirm`, {
      method: 'POST',
      token,
    })
  },
  withViewerState(route: RouteRead, state?: RouteViewerStateRead) {
    return mergeViewerState(route, state)
  },
  withViewerStates(routes: RouteRead[], viewerStates: RouteViewerStateRead[] = []) {
    const stateByRouteId = new Map(viewerStates.map((state) => [state.route_id, state]))
    return routes.map((route) => mergeViewerState(route, stateByRouteId.get(route.id)))
  },
  toCatalogRoutes(routes: RouteWithViewerState[]) {
    return routes.map(mapRouteToCatalogRoute)
  },
  toRouteDetails(route: RouteWithViewerState | null) {
    return route ? mapRouteToRouteDetails(route) : null
  },
}
