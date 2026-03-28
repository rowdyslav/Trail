import { apiRequest } from '../../../shared/api/http'
import type { CatalogRoute, Checkpoint, Landmark, RouteAccessType, RouteDetails } from '../../../shared/types/game'

interface PlaceRead {
  id: string
  title: string
}

export interface RouteRead {
  id: string
  title: string
  description: string
  route_type: RouteAccessType
  reward_points_on_completion: number
  places_total: number
  places: PlaceRead[]
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

const getDistanceLabel = (placesTotal: number) => `${(Math.max(placesTotal, 1) * 0.8).toFixed(1).replace('.', ',')} км`

const getRouteImage = (accessType: RouteAccessType, index: number) => {
  const images = routeImages[accessType]
  return images[index % images.length]
}

const guessCity = (description: string) => {
  const normalized = description.toLowerCase()

  if (normalized.includes('рязан')) {
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

const mapPlaceToCheckpoint = (place: PlaceRead, index: number): Checkpoint => ({
  id: place.id,
  title: place.title,
  subtitle: index === 0 ? 'Старт маршрута' : `Точка ${index + 1}`,
  hint: 'Точка загружена с backend. Для активации используйте универсальную ссылку /activate.',
  storyBeat: 'Маршрут синхронизирован с backend.',
  xp: 50,
  status: index === 0 ? 'available' : 'locked',
  reward: {
    title: `Награда за ${place.title}`,
    description: 'После подтверждения точки прогресс обновится в приложении.',
  },
})

const mapRouteToCatalogRoute = (route: RouteRead, index: number): CatalogRoute => ({
  id: route.id,
  city: guessCity(route.description),
  title: route.title,
  description: route.description,
  distanceLabel: getDistanceLabel(route.places_total),
  durationLabel: getDurationLabel(route.places_total),
  image: getRouteImage(route.route_type, index),
  accessType: route.route_type,
  priceLabel: route.route_type === 'free' ? 'Free' : `${route.reward_points_on_completion} points`,
  pricePoints: route.route_type === 'paid' ? route.reward_points_on_completion : undefined,
  purchased: route.route_type === 'free',
  isActive: index === 0,
})

const mapRouteToRouteDetails = (route: RouteRead): RouteDetails => ({
  id: route.id,
  city: guessCity(route.description),
  title: route.title,
  description: route.description,
  accessType: route.route_type,
  currentLegLabel: route.places[0]?.title ?? 'Маршрут готов к старту',
  estimatedTime: getDurationLabel(route.places_total),
  distance: getDistanceLabel(route.places_total),
  checkpoints: route.places.map(mapPlaceToCheckpoint),
  progress: 0,
})

const mapRouteToLandmarks = (route: RouteRead): Landmark[] =>
  route.places.map((place, index) => ({
    id: place.id,
    title: place.title,
    subtitle: index === 0 ? 'Следующая точка маршрута' : `Остановка ${index + 1}`,
    image: getRouteImage(route.route_type, index),
    state: index === 0 ? 'active' : 'locked',
  }))

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
  toCatalogRoutes(routes: RouteRead[]) {
    return routes.map(mapRouteToCatalogRoute)
  },
  toRouteDetails(route: RouteRead | null) {
    return route ? mapRouteToRouteDetails(route) : null
  },
  toLandmarks(route: RouteRead | null) {
    return route ? mapRouteToLandmarks(route) : []
  },
}
