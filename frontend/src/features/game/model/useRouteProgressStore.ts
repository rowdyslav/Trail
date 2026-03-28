import { create } from 'zustand'

import type { CatalogRoute, RouteAccessType, RouteDetails } from '../../../shared/types/game'
import { useAuthStore } from '../../auth/model/useAuthStore'
import { routesApi, type RouteRead, type RouteViewerProfileState } from '../../navigation/api/routesApi'

interface RouteProgressState {
  route: RouteDetails
  savedRoute: RouteDetails
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
  priceLabel: 'Бесплатно',
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

const readRoutes = async (routeType?: RouteAccessType | null) => {
  const token = useAuthStore.getState().authToken
  return routesApi.list(routeType, token)
}

const readRoute = async (routeId: string) => {
  const token = useAuthStore.getState().authToken
  return routesApi.read(routeId, token)
}

const getBackendSelectedRouteId = (
  catalogRoutes: RouteRead[],
  viewerState?: RouteViewerProfileState,
  selectedRoute?: RouteRead | null,
) => {
  if (viewerState?.activeRouteId) {
    return viewerState.activeRouteId
  }

  const normalizedSelectedRoute = selectedRoute ? routesApi.normalize(selectedRoute, viewerState) : null

  if (normalizedSelectedRoute?.is_active) {
    return normalizedSelectedRoute.id
  }

  return routesApi.normalizeMany(catalogRoutes, viewerState).find((route) => route.is_active)?.id ?? null
}

const getDisplayedRoute = (
  previewRoute?: RouteRead | null,
  savedRoute?: RouteRead | null,
) => {
  if (previewRoute) {
    return previewRoute
  }

  return savedRoute ?? null
}

const ensureProfileSynced = async () => {
  const result = await useAuthStore.getState().refreshMe()

  if (!result.success) {
    throw new Error(result.error ?? 'Could not refresh user profile.')
  }
}

const getSyncedCatalogAndRouteState = async (previewRouteId?: string | null) => {
  const activeRouteTypeFilter = useRouteProgressStore.getState().activeRouteTypeFilter
  const viewerState = getViewerProfileState()
  const selectedRouteIdFromProfile = viewerState?.activeRouteId ?? null

  const [catalogRoutes, previewRoute, selectedRoute] = await Promise.all([
    readRoutes(activeRouteTypeFilter),
    previewRouteId ? readRoute(previewRouteId).catch(() => null) : Promise.resolve(null),
    selectedRouteIdFromProfile ? readRoute(selectedRouteIdFromProfile).catch(() => null) : Promise.resolve(null),
  ])

  const backendSelectedRouteId = getBackendSelectedRouteId(catalogRoutes, viewerState, selectedRoute)
  const savedRoute = selectedRoute ?? (backendSelectedRouteId ? catalogRoutes.find((route) => route.id === backendSelectedRouteId) ?? null : null)
  const displayedRoute = getDisplayedRoute(previewRoute, savedRoute)

  return {
    catalogRoutes: routesApi.toCatalogRoutes(catalogRoutes, viewerState),
    route: routesApi.toRouteDetails(displayedRoute, viewerState) ?? fallbackRoute,
    savedRoute: routesApi.toRouteDetails(savedRoute, viewerState) ?? fallbackRoute,
    selectedRouteId: backendSelectedRouteId,
    hasRouteSelection: Boolean(backendSelectedRouteId),
  }
}

export const useRouteProgressStore = create<RouteProgressState>(() => ({
  route: fallbackRoute,
  savedRoute: fallbackRoute,
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
    useRouteProgressStore.setState({
      isRouteActionLoading: true,
      routeActionError: null,
    })

    try {
      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null)),
        previewRouteId: null,
        isRouteActionLoading: false,
      })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось открыть сохранённый маршрут.'

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
      savedRoute: fallbackRoute,
      hasRouteSelection: false,
      selectedRouteId: null,
      previewRouteId: null,
      catalogRoutes: [],
      isCatalogLoading: false,
      isRouteActionLoading: false,
      catalogError: null,
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
      const nextState = await getSyncedCatalogAndRouteState(state.previewRouteId)

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
      const nextState = await getSyncedCatalogAndRouteState(state.previewRouteId)

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
      await ensureProfileSynced()

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null)),
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

      await ensureProfileSynced()

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null)),
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
      await ensureProfileSynced()

      useRouteProgressStore.setState({
        ...(await getSyncedCatalogAndRouteState(null)),
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
