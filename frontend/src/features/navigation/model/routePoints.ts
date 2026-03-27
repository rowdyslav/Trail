export const RoutePointId = {
  RouteStart: 'route_start',
  CathedralSquare: 'cathedral_square',
} as const

export type RoutePointId = (typeof RoutePointId)[keyof typeof RoutePointId]

export interface RoutePoint {
  latitude: number
  longitude: number
  label: string
}

export const routePoints: Record<RoutePointId, RoutePoint> = {
  [RoutePointId.RouteStart]: {
    latitude: 54.6299,
    longitude: 39.7416,
    label: 'Старт маршрута',
  },
  [RoutePointId.CathedralSquare]: {
    latitude: 54.6307,
    longitude: 39.7494,
    label: 'Соборная площадь',
  },
}

export const DEFAULT_NAVIGATION_DESTINATION: RoutePointId = RoutePointId.CathedralSquare
