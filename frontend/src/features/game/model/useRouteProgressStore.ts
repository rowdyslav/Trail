import { create } from 'zustand'
import { catalogRoutes, mockRoute } from '../../../entities/quest/model/mockData'
import { routesApi, type RouteRead } from '../../navigation/api/routesApi'
import type { CatalogRoute, Landmark, RouteAccessType, RouteDetails } from '../../../shared/types/game'

interface RouteProgressState {
  route: RouteDetails
  catalogRoutes: CatalogRoute[]
  routeLandmarks: Landmark[]
  isCatalogLoading: boolean
  catalogError: string | null
  activeRouteTypeFilter: RouteAccessType | null
  loadCatalogRoutes: (routeType?: RouteAccessType | null) => Promise<void>
}

const getRouteProgress = (completedCount: number, totalCount: number) => {
  if (totalCount === 0) {
    return 0
  }

  return Math.round((completedCount / totalCount) * 100)
}

const fallbackRoute: RouteDetails = {
  ...mockRoute,
  progress: getRouteProgress(
    mockRoute.checkpoints.filter((checkpoint) => checkpoint.status === 'completed').length,
    mockRoute.checkpoints.length,
  ),
}

const syncPrimaryRoute = (routes: RouteRead[]) => {
  const primaryRoute = routes[0] ?? null
  const mappedRoute = routesApi.toRouteDetails(primaryRoute)

  return {
    route: mappedRoute ?? fallbackRoute,
    routeLandmarks: routesApi.toLandmarks(primaryRoute),
  }
}

export const useRouteProgressStore = create<RouteProgressState>(() => ({
  route: fallbackRoute,
  catalogRoutes,
  routeLandmarks: [],
  isCatalogLoading: false,
  catalogError: null,
  activeRouteTypeFilter: null,
  loadCatalogRoutes: async (routeType = null) => {
    useRouteProgressStore.setState({
      isCatalogLoading: true,
      catalogError: null,
      activeRouteTypeFilter: routeType,
    })

    try {
      const routes = await routesApi.list(routeType)

      useRouteProgressStore.setState({
        catalogRoutes: routesApi.toCatalogRoutes(routes),
        ...syncPrimaryRoute(routes),
        isCatalogLoading: false,
      })
    } catch (error) {
      useRouteProgressStore.setState({
        isCatalogLoading: false,
        catalogError: error instanceof Error ? error.message : 'Не удалось загрузить маршруты.',
      })
    }
  },
}))
