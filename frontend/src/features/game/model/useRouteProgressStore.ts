import { create } from 'zustand'
import type { CatalogRoute, RouteAccessType, RouteDetails } from '../../../shared/types/game'
import { useAuthStore } from '../../auth/model/useAuthStore'
import { routesApi, type RouteRead, type RouteViewerProfileState } from '../../navigation/api/routesApi'

interface RouteProgressState {
  route: RouteDetails
  hasRouteSelection: boolean
  selectedRouteId: string | null
  previewRouteId: string | null
  catalogRoutes: CatalogRoute[]
  isCatalogLoading: boolean
  isRouteActionLoading: boolean
  catalogError: string | null
  routeActionError: string | null
  activeRouteTypeFilter: RouteAccessType | null
  clearRouteActionError: () => void
  clearPreviewRoute: () => Promise<{ success: boolean; error?: string }>
  resetRouteState: () => void
  syncRouteStateFromProfile: () => Promise<void>
  loadCatalogRoutes: (routeType?: RouteAccessType | null) => Promise<void>
  selectRoute: (routeId: string) => Promise<{ success: boolean; error?: string }>
  previewRoute: (routeId: string) => Promise<{ success: boolean; error?: string }>
  purchaseRoute: (payload: { routeId: string; returnUrl: string }) => Promise<{ success: boolean; error?: string }>
  confirmRoutePurchase: (routeId: string) => Promise<{ success: boolean; error?: string }>
}

const fallbackRoute: RouteDetails = {
  id: '',
  city: '',
  title: 'Выберите маршрут в каталоге',
  description: 'Маршрут появится здесь после загрузки данных с сервера.',
  image: '',
  accessType: 'free',
  priceRub: 0,
  priceLabel: 'Free',
  isPurchased: false,
  isActive: false,
  isCompleted: false,
  currentLegLabel: 'Маршрут не выбран',
  estimatedTime: '—',
  distance: '—',
  checkpoints: [],
  routePoints: [],
  progress: 0,
}

const getRouteById = (routes: RouteRead[], routeId?: string | null) =>
  routeId ? routes.find((routeItem) => routeItem.id === routeId) ?? null : null

const getViewerProfileState = (): RouteViewerProfileState | undefined => {
  const { authToken, user } = useAuthStore.getState()

  if (!authToken) {
    return undefined
  }

  return {
    activeRouteId: user.activeRouteId,
    purchasedRouteIds: user.purchasedRouteIds,
  }
}

const getCurrentActiveRoute = (routes: RouteRead[], viewerState?: RouteViewerProfileState) => {
  const activeRouteId = routesApi.normalizeMany(routes, viewerState).find((routeItem) => routeItem.is_active)?.id ?? null
  return getRouteById(routes, activeRouteId)
}

const readRoutes = async (routeType?: RouteAccessType | null) => {
  const token = useAuthStore.getState().authToken
  return routesApi.list(routeType, token)
}

const readRoute = async (routeId: string) => {
  const token = useAuthStore.getState().authToken
  return routesApi.read(routeId, token)
}

const getResolvedRoute = (
  routes: RouteRead[],
  previewRouteId?: string | null,
  selectedRouteId?: string | null,
  explicitRoute?: RouteRead | null,
  viewerState?: RouteViewerProfileState,
) => {
  if (explicitRoute) {
    return explicitRoute
  }

  return getRouteById(routes, previewRouteId) ?? getRouteById(routes, selectedRouteId) ?? getCurrentActiveRoute(routes, viewerState) ?? null
}

const getSyncedCatalogAndRouteState = async (
  previewRouteId?: string | null,
  selectedRouteId?: string | null,
  explicitRouteId?: string | null,
) => {
  const activeRouteTypeFilter = useRouteProgressStore.getState().activeRouteTypeFilter
  const viewerState = getViewerProfileState()
  const routesPromise = readRoutes(activeRouteTypeFilter)
  const routePromise = explicitRouteId ? readRoute(explicitRouteId).catch(() => null) : Promise.resolve(null)

  const [routes, explicitRoute] = await Promise.all([routesPromise, routePromise])
  const normalizedExplicitRoute = explicitRoute ? routesApi.normalize(explicitRoute, viewerState) : null
  const activeRoute = normalizedExplicitRoute?.is_active ? explicitRoute : getCurrentActiveRoute(routes, viewerState)
  const profileSelectedRouteId = viewerState?.activeRouteId ?? null
  const nextSelectedRouteId = profileSelectedRouteId ?? activeRoute?.id ?? selectedRouteId ?? null
  const resolvedRoute = getResolvedRoute(routes, previewRouteId, nextSelectedRouteId, explicitRoute, viewerState)

  return {
    catalogRoutes: routesApi.toCatalogRoutes(routes, viewerState),
    route: routesApi.toRouteDetails(resolvedRoute, viewerState) ?? fallbackRoute,
    selectedRouteId: nextSelectedRouteId,
    hasRouteSelection: Boolean(nextSelectedRouteId),
  }
}

export const useRouteProgressStore = create<RouteProgressState>(() => ({
  route: fallbackRoute,
  hasRouteSelection: false,
  selectedRouteId: null,
  previewRouteId: null,
  catalogRoutes: [],
  isCatalogLoading: false,
  isRouteActionLoading: false,
  catalogError: null,
  routeActionError: null,
  activeRouteTypeFilter: null,
  clearRouteActionError: () => {
    useRouteProgressStore.setState({ routeActionError: null })
  },
  clearPreviewRoute: async () => {
    const { selectedRouteId } = useRouteProgressStore.getState()

    useRouteProgressStore.setState({
      isRouteActionLoading: true,
      routeActionError: null,
    })

    if (!selectedRouteId) {
      useRouteProgressStore.setState({
        previewRouteId: null,
        route: fallbackRoute,
        isRouteActionLoading: false,
      })

      return { success: true }
    }

    try {
      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null, selectedRouteId, selectedRouteId)),
        previewRouteId: null,
        isRouteActionLoading: false,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось открыть выбранный маршрут.'

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
  resetRouteState: () => {
    useRouteProgressStore.setState({
      route: fallbackRoute,
      hasRouteSelection: false,
      selectedRouteId: null,
      previewRouteId: null,
      isRouteActionLoading: false,
      routeActionError: null,
      activeRouteTypeFilter: null,
    })
  },
  syncRouteStateFromProfile: async () => {
    const state = useRouteProgressStore.getState()

    if (!useAuthStore.getState().authToken) {
      return
    }

    useRouteProgressStore.setState({
      isCatalogLoading: true,
      catalogError: null,
    })

    try {
      const nextState = await getSyncedCatalogAndRouteState(state.previewRouteId, state.selectedRouteId)

      useRouteProgressStore.setState({
        ...nextState,
        previewRouteId: state.previewRouteId,
        isCatalogLoading: false,
      })
    } catch (error) {
      useRouteProgressStore.setState({
        isCatalogLoading: false,
        catalogError: error instanceof Error ? error.message : 'Не удалось синхронизировать маршруты.',
      })
    }
  },
  loadCatalogRoutes: async (routeType = null) => {
    useRouteProgressStore.setState({
      isCatalogLoading: true,
      catalogError: null,
      activeRouteTypeFilter: routeType,
    })

    try {
      const state = useRouteProgressStore.getState()
      const nextState = await getSyncedCatalogAndRouteState(state.previewRouteId, state.selectedRouteId)

      useRouteProgressStore.setState({
        ...nextState,
        previewRouteId: state.previewRouteId,
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
      await useAuthStore.getState().refreshMe()

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null, routeId, routeId)),
        previewRouteId: null,
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
      const route = await readRoute(routeId)
      const selectedRouteId = useRouteProgressStore.getState().selectedRouteId
      const viewerState = getViewerProfileState()

      useRouteProgressStore.setState({
        route: routesApi.toRouteDetails(route, viewerState) ?? fallbackRoute,
        previewRouteId: routeId,
        selectedRouteId,
        hasRouteSelection: Boolean(selectedRouteId),
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
      const payment = await routesApi.createPayment(routeId, token, { return_url: returnUrl })

      if (payment.confirmation_url) {
        window.location.assign(payment.confirmation_url)
        return { success: true }
      }

      if (!payment.is_confirmed) {
        throw new Error('Backend did not return a payment page URL for this route payment.')
      }

      await useAuthStore.getState().refreshMe()

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null, routeId, routeId)),
        previewRouteId: null,
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
      await routesApi.confirmPayment(routeId, token)
      await routesApi.select(routeId, token)
      await useAuthStore.getState().refreshMe()

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null, routeId, routeId)),
        previewRouteId: null,
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
