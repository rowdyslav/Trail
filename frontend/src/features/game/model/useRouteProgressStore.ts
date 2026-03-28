import { create } from 'zustand'
import { catalogRoutes, mockRoute } from '../../../entities/quest/model/mockData'
import type { CatalogRoute, RouteAccessType, RouteDetails } from '../../../shared/types/game'
import { useAuthStore } from '../../auth/model/useAuthStore'
import { routesApi, type RouteViewerStateRead, type RouteWithViewerState } from '../../navigation/api/routesApi'

interface RouteProgressState {
  route: RouteDetails
  catalogRoutes: CatalogRoute[]
  isCatalogLoading: boolean
  isRouteActionLoading: boolean
  catalogError: string | null
  routeActionError: string | null
  activeRouteTypeFilter: RouteAccessType | null
  clearRouteActionError: () => void
  loadCatalogRoutes: (routeType?: RouteAccessType | null) => Promise<void>
  selectRoute: (routeId: string) => Promise<{ success: boolean; error?: string }>
  previewRoute: (routeId: string) => Promise<{ success: boolean; error?: string }>
  purchaseRoute: (payload: { routeId: string; returnUrl: string }) => Promise<{ success: boolean; error?: string }>
  confirmRoutePurchase: (routeId: string) => Promise<{ success: boolean; error?: string }>
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

const getPreferredRoute = (routes: RouteWithViewerState[], preferredRouteId?: string | null) => {
  if (!routes.length) {
    return null
  }

  return (
    routes.find((routeItem) => routeItem.is_active) ??
    (preferredRouteId ? routes.find((routeItem) => routeItem.id === preferredRouteId) : null) ??
    routes[0]
  )
}

const getSyncedRouteState = (routes: RouteWithViewerState[], preferredRouteId?: string | null) => ({
  route: routesApi.toRouteDetails(getPreferredRoute(routes, preferredRouteId)) ?? fallbackRoute,
})

const getSyncedCatalogAndRouteState = async (preferredRouteId?: string | null) => {
  const activeRouteTypeFilter = useRouteProgressStore.getState().activeRouteTypeFilter
  const routesPromise = readRoutesWithViewerStates(activeRouteTypeFilter)
  const routePromise = preferredRouteId
    ? readRouteWithViewerState(preferredRouteId).catch(() => null)
    : Promise.resolve(null)

  const [routes, explicitRoute] = await Promise.all([routesPromise, routePromise])

  return {
    catalogRoutes: routesApi.toCatalogRoutes(routes),
    route: routesApi.toRouteDetails(explicitRoute ?? getPreferredRoute(routes, preferredRouteId)) ?? fallbackRoute,
  }
}

const readViewerStatesSafely = async (token: string | null) => {
  if (!token) {
    return [] satisfies RouteViewerStateRead[]
  }

  try {
    return await routesApi.listViewerStates(token)
  } catch {
    return [] satisfies RouteViewerStateRead[]
  }
}

const readViewerStateSafely = async (routeId: string, token: string | null) => {
  if (!token) {
    return undefined
  }

  try {
    return await routesApi.readViewerState(routeId, token)
  } catch {
    return undefined
  }
}

const readRoutesWithViewerStates = async (routeType?: RouteAccessType | null) => {
  const token = useAuthStore.getState().authToken
  const routes = await routesApi.list(routeType)
  const viewerStates = await readViewerStatesSafely(token)

  return routesApi.withViewerStates(routes, viewerStates)
}

const readRouteWithViewerState = async (routeId: string) => {
  const token = useAuthStore.getState().authToken
  const route = await routesApi.read(routeId)
  const viewerState = await readViewerStateSafely(routeId, token)

  return routesApi.withViewerState(route, viewerState)
}

export const useRouteProgressStore = create<RouteProgressState>(() => ({
  route: fallbackRoute,
  catalogRoutes,
  isCatalogLoading: false,
  isRouteActionLoading: false,
  catalogError: null,
  routeActionError: null,
  activeRouteTypeFilter: null,
  clearRouteActionError: () => {
    useRouteProgressStore.setState({ routeActionError: null })
  },
  loadCatalogRoutes: async (routeType = null) => {
    useRouteProgressStore.setState({
      isCatalogLoading: true,
      catalogError: null,
      activeRouteTypeFilter: routeType,
    })

    try {
      const routes = await readRoutesWithViewerStates(routeType)
      const preferredRouteId = useRouteProgressStore.getState().route.id

      useRouteProgressStore.setState({
        catalogRoutes: routesApi.toCatalogRoutes(routes),
        ...getSyncedRouteState(routes, preferredRouteId),
        isCatalogLoading: false,
      })
    } catch (error) {
      useRouteProgressStore.setState({
        isCatalogLoading: false,
        catalogError: error instanceof Error ? error.message : 'Не удалось загрузить маршруты.',
      })
    }
  },
  selectRoute: async (routeId) => {
    const token = useAuthStore.getState().authToken

    if (!token) {
      useRouteProgressStore.setState({ routeActionError: 'Authorization required.' })

      return {
        success: false,
        error: 'Authorization required.',
      }
    }

    useRouteProgressStore.setState({
      isRouteActionLoading: true,
      routeActionError: null,
    })

    try {
      await routesApi.select(routeId, token)

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(routeId)),
        isRouteActionLoading: false,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось переключить маршрут.'

      useRouteProgressStore.setState({
        isRouteActionLoading: false,
        routeActionError: message,
      })

      return {
        success: false,
        error: message,
      }
    }
  },
  previewRoute: async (routeId) => {
    useRouteProgressStore.setState({
      isRouteActionLoading: true,
      routeActionError: null,
    })

    try {
      const route = await readRouteWithViewerState(routeId)

      useRouteProgressStore.setState({
        route: routesApi.toRouteDetails(route) ?? fallbackRoute,
        isRouteActionLoading: false,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось открыть маршрут.'

      useRouteProgressStore.setState({
        isRouteActionLoading: false,
        routeActionError: message,
      })

      return {
        success: false,
        error: message,
      }
    }
  },
  purchaseRoute: async ({ routeId, returnUrl }) => {
    const token = useAuthStore.getState().authToken

    if (!token) {
      useRouteProgressStore.setState({ routeActionError: 'Authorization required.' })

      return {
        success: false,
        error: 'Authorization required.',
      }
    }

    useRouteProgressStore.setState({
      isRouteActionLoading: true,
      routeActionError: null,
    })

    try {
      const purchase = await routesApi.purchase(routeId, token, { return_url: returnUrl })

      if (purchase.confirmation_url) {
        window.location.assign(purchase.confirmation_url)
        return { success: true }
      }

      if (!purchase.is_confirmed) {
        throw new Error('Backend did not return a payment page URL for this route purchase.')
      }

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(routeId)),
        isRouteActionLoading: false,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось купить маршрут.'

      useRouteProgressStore.setState({
        isRouteActionLoading: false,
        routeActionError: message,
      })

      return {
        success: false,
        error: message,
      }
    }
  },
  confirmRoutePurchase: async (routeId) => {
    const token = useAuthStore.getState().authToken

    if (!token) {
      useRouteProgressStore.setState({ routeActionError: 'Authorization required.' })

      return {
        success: false,
        error: 'Authorization required.',
      }
    }

    useRouteProgressStore.setState({
      isRouteActionLoading: true,
      routeActionError: null,
    })

    try {
      await routesApi.confirmPurchase(routeId, token)
      await routesApi.select(routeId, token)

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(routeId)),
        isRouteActionLoading: false,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подтвердить покупку маршрута.'

      useRouteProgressStore.setState({
        isRouteActionLoading: false,
        routeActionError: message,
      })

      return {
        success: false,
        error: message,
      }
    }
  },
}))
