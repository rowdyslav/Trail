import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { useRouteProgressStore } from '../../features/game/model/useRouteProgressStore'
import type { RouteAccessType } from '../../shared/types/game'

const sectionMeta = {
  free: {
    title: 'Бесплатные маршруты',
    description: 'Маршруты для первого знакомства с городом и игровым форматом.',
  },
  paid: {
    title: 'Платные маршруты',
    description: 'Маршруты с дополнительными точками, историей и наградами.',
  },
} as const

export function CatalogPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const handledPurchaseRouteIdRef = useRef<string | null>(null)
  const authToken = useAuthStore((state) => state.authToken)
  const catalogRoutes = useRouteProgressStore((state) => state.catalogRoutes)
  const isCatalogLoading = useRouteProgressStore((state) => state.isCatalogLoading)
  const isRouteActionLoading = useRouteProgressStore((state) => state.isRouteActionLoading)
  const catalogError = useRouteProgressStore((state) => state.catalogError)
  const routeActionError = useRouteProgressStore((state) => state.routeActionError)
  const clearRouteActionError = useRouteProgressStore((state) => state.clearRouteActionError)
  const loadCatalogRoutes = useRouteProgressStore((state) => state.loadCatalogRoutes)
  const selectRoute = useRouteProgressStore((state) => state.selectRoute)
  const previewRoute = useRouteProgressStore((state) => state.previewRoute)
  const purchaseRoute = useRouteProgressStore((state) => state.purchaseRoute)
  const confirmRoutePurchase = useRouteProgressStore((state) => state.confirmRoutePurchase)

  const routeTypeParam = searchParams.get('route_type')
  const pendingPurchaseRouteId = searchParams.get('purchase_route_id')
  const activeFilter: RouteAccessType | null =
    routeTypeParam === 'free' || routeTypeParam === 'paid' ? routeTypeParam : null

  useEffect(() => {
    if (authToken && pendingPurchaseRouteId) {
      return
    }

    void loadCatalogRoutes(activeFilter)
  }, [activeFilter, authToken, loadCatalogRoutes, pendingPurchaseRouteId])

  useEffect(() => {
    clearRouteActionError()
  }, [clearRouteActionError])

  useEffect(() => {
    if (!authToken || !pendingPurchaseRouteId || handledPurchaseRouteIdRef.current === pendingPurchaseRouteId) {
      return
    }

    handledPurchaseRouteIdRef.current = pendingPurchaseRouteId

    void (async () => {
      const result = await confirmRoutePurchase(pendingPurchaseRouteId)

      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('purchase_route_id')
      setSearchParams(nextParams)

      if (result.success) {
        navigate('/route', { replace: true })
      }
    })()
  }, [authToken, confirmRoutePurchase, navigate, pendingPurchaseRouteId, searchParams, setSearchParams])

  const handleFilterChange = (nextFilter: RouteAccessType | null) => {
    const nextParams = new URLSearchParams(searchParams)

    if (nextFilter) {
      nextParams.set('route_type', nextFilter)
    } else {
      nextParams.delete('route_type')
    }

    setSearchParams(nextParams)
  }

  const handleSelectRoute = async (routeId: string) => {
    const result = await selectRoute(routeId)

    if (result.success) {
      navigate('/route')
    }
  }

  const handlePreviewRoute = async (routeId: string) => {
    const result = await previewRoute(routeId)

    if (result.success) {
      navigate('/route')
    }
  }

  const handlePurchaseRoute = async (routeId: string) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('purchase_route_id', routeId)

    const returnUrl = `${window.location.origin}/routes${nextParams.toString() ? `?${nextParams}` : ''}`
    await purchaseRoute({ routeId, returnUrl })
  }

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-8 pb-32">
      <section className="rounded-[2rem] bg-[#edf2ec] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Каталог</p>
        <div className="mt-3 flex flex-col content-center gap-4 sm:flex-row sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a] sm:text-4xl">
              Выбери маршрут и начни путь по Рязани
            </h1>
          </div>
          <Link
            to={authToken ? '/profile' : '/auth'}
            className="inline-flex h-fit items-center justify-center rounded-full bg-[#0f5238] px-5 py-5 text-sm font-bold text-white"
          >
            {authToken ? 'Перейти в профиль' : 'Войти в аккаунт'}
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleFilterChange(null)}
            className={
              activeFilter === null
                ? 'rounded-full bg-[#0f5238] px-4 py-2 text-sm font-bold text-white'
                : 'rounded-full border border-[#c8d2c9] bg-white px-4 py-2 text-sm font-bold text-[#1a1c1a]'
            }
          >
            Все
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('free')}
            className={
              activeFilter === 'free'
                ? 'rounded-full bg-[#0f5238] px-4 py-2 text-sm font-bold text-white'
                : 'rounded-full border border-[#c8d2c9] bg-white px-4 py-2 text-sm font-bold text-[#1a1c1a]'
            }
          >
            Бесплатные
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('paid')}
            className={
              activeFilter === 'paid'
                ? 'rounded-full bg-[#0f5238] px-4 py-2 text-sm font-bold text-white'
                : 'rounded-full border border-[#c8d2c9] bg-white px-4 py-2 text-sm font-bold text-[#1a1c1a]'
            }
          >
            Платные
          </button>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a]">
            {activeFilter ? sectionMeta[activeFilter].title : 'Все маршруты'}
          </h2>
          <p className="text-sm leading-6 text-[#404943]">
            {activeFilter ? sectionMeta[activeFilter].description : 'Полный список маршрутов.'}
          </p>
        </div>

        {catalogError ? (
          <div className="rounded-[1.5rem] border border-[#f0c7be] bg-[#fff3f0] px-5 py-4 text-sm font-medium text-[#9b4232]">
            {catalogError}
          </div>
        ) : null}

        {routeActionError ? (
          <div className="rounded-[1.5rem] border border-[#f0c7be] bg-[#fff3f0] px-5 py-4 text-sm font-medium text-[#9b4232]">
            {routeActionError}
          </div>
        ) : null}

        {isCatalogLoading ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-[28rem] animate-pulse rounded-[2rem] bg-[#edf2ec]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {catalogRoutes.map((route) => {
              const canSelect = Boolean(authToken && route.purchased && !route.isActive)
              const canPreview = !route.isActive
              const canBuy = route.accessType === 'paid' && !route.purchased

              return (
                <article
                  key={route.id}
                  className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-[#dfe5dc] bg-white shadow-[0_16px_40px_rgba(15,82,56,0.08)]"
                >
                  <div className="relative h-52">
                    <img src={route.image} alt={route.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute left-5 right-5 top-5">
                      <span className="rounded-full bg-[#0f5238] px-3 py-1 text-sm font-semibold text-white">
                        {route.priceLabel}
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">{route.city}</p>
                      <h3 className="mt-2 text-2xl font-extrabold">{route.title}</h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-5 p-6">
                    <p className="text-sm leading-6 text-[#404943]">{route.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm font-semibold text-[#404943]">
                      {authToken && route.purchased ? (
                        <span className="rounded-full bg-[#edf7ee] px-3 py-2 text-[#0f5238]">Доступен</span>
                      ) : null}
                      {authToken && route.isActive ? (
                        <span className="rounded-full bg-[#0f5238] px-3 py-2 text-white">Активный</span>
                      ) : null}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-3">
                      {route.isActive ? (
                        <Link
                          to="/route"
                          className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
                        >
                          Продолжить маршрут
                        </Link>
                      ) : canPreview && (
                        <button
                          type="button"
                          onClick={() => void handlePreviewRoute(route.id)}
                          disabled={isRouteActionLoading}
                          className="rounded-full bg-[#1a1c1a] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRouteActionLoading ? 'Открываем...' : 'Открыть маршрут'}
                        </button>
                      )}

                      {canSelect ? (
                        <button
                          type="button"
                          onClick={() => void handleSelectRoute(route.id)}
                          disabled={isRouteActionLoading}
                          className="rounded-full border border-[#0f5238] px-5 py-3 text-sm font-bold text-[#0f5238] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRouteActionLoading ? 'Сохраняем...' : 'Сохранить маршрут'}
                        </button>
                      ) : canBuy ? authToken ? (
                        <button
                          type="button"
                          onClick={() => void handlePurchaseRoute(route.id)}
                          disabled={isRouteActionLoading}
                          className="rounded-full border border-[#0f5238] px-5 py-3 text-sm font-bold text-[#0f5238] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRouteActionLoading ? 'Покупаем...' : 'Купить маршрут'}
                        </button>
                      ) : (
                        <Link
                          to="/auth"
                          className="inline-flex items-center justify-center rounded-full border border-[#0f5238] px-5 py-3 text-sm font-bold text-[#0f5238]"
                        >
                          Войти для покупки
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {!isCatalogLoading && !catalogError && catalogRoutes.length === 0 ? (
          <div className="rounded-[2rem] bg-white px-6 py-8 text-sm text-[#404943] shadow-sm">
            По выбранному фильтру маршруты не найдены.
          </div>
        ) : null}
      </section>
    </main>
  )
}
