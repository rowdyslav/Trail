import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MdCheckCircle, MdChevronRight, MdFlag, MdLock, MdQrCode2, MdRadioButtonChecked } from 'react-icons/md'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { useRouteProgressStore } from '../../features/game/model/useRouteProgressStore'
import { RouteMap } from '../../features/navigation/ui/RouteMap'

export function RoutePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const handledPurchaseRouteIdRef = useRef<string | null>(null)
  const authToken = useAuthStore((state) => state.authToken)
  const route = useRouteProgressStore((state) => state.route)
  const hasRouteSelection = useRouteProgressStore((state) => state.hasRouteSelection)
  const previewRouteId = useRouteProgressStore((state) => state.previewRouteId)
  const isCatalogLoading = useRouteProgressStore((state) => state.isCatalogLoading)
  const isRouteActionLoading = useRouteProgressStore((state) => state.isRouteActionLoading)
  const routeActionError = useRouteProgressStore((state) => state.routeActionError)
  const loadCatalogRoutes = useRouteProgressStore((state) => state.loadCatalogRoutes)
  const clearRouteActionError = useRouteProgressStore((state) => state.clearRouteActionError)
  const clearPreviewRoute = useRouteProgressStore((state) => state.clearPreviewRoute)
  const selectRoute = useRouteProgressStore((state) => state.selectRoute)
  const purchaseRoute = useRouteProgressStore((state) => state.purchaseRoute)
  const confirmRoutePurchase = useRouteProgressStore((state) => state.confirmRoutePurchase)
  const pendingPurchaseRouteId = searchParams.get('purchase_route_id')
  const isPreview = Boolean(previewRouteId)
  const isPaidLocked = route.accessType === 'paid' && !route.isPurchased
  const shouldShowMap = Boolean(authToken && (route.isActive || isPreview))

  useEffect(() => {
    if (authToken && pendingPurchaseRouteId) {
      return
    }

    void loadCatalogRoutes()
  }, [authToken, loadCatalogRoutes, pendingPurchaseRouteId])

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

  const handlePurchaseRoute = async () => {
    const nextParams = new URLSearchParams(searchParams)

    nextParams.set('purchase_route_id', route.id)

    const returnUrl = `${window.location.origin}/route${nextParams.toString() ? `?${nextParams}` : ''}`
    await purchaseRoute({ routeId: route.id, returnUrl })
  }

  const handleSelectRoute = async () => {
    const result = await selectRoute(route.id)

    if (result.success) {
      navigate('/route', { replace: true })
    }
  }

  const handleOpenSelectedRoute = async () => {
    const result = await clearPreviewRoute()

    if (result.success) {
      navigate('/route', { replace: true })
    }
  }

  const statusLabel = route.isCompleted
    ? 'Маршрут завершён'
    : route.isActive
      ? 'Активный маршрут'
      : isPreview
        ? 'Превью маршрута'
        : 'Маршрут доступен'

  const navigationTitle = authToken ? 'Карта откроется после выбора маршрута' : 'Карта доступна после входа'
  const navigationDescription = authToken
    ? 'Сначала нужно выбрать этот маршрут активным. После этого откроется живая карта и навигация по точкам.'
    : 'Войдите в аккаунт, чтобы выбрать маршрут и открыть навигацию по точкам.'

  if (!authToken) {
    return (
      <main className="mx-auto max-w-2xl px-6 pb-32 pt-6">
        <section className="rounded-[2rem] border border-[#dfe5dc] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0f5238]">Маршрут</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1a]">
              Войдите в аккаунт, чтобы выбрать маршрут
            </h1>
            <p className="text-sm leading-6 text-[#404943]">
              Для незарегистрированного пользователя текущий маршрут не отображается. После входа вы сможете выбрать
              маршрут и открыть навигацию по точкам.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={`/auth?next=${encodeURIComponent('/route')}`}
                className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
              >
                Войти в аккаунт
              </Link>
              <Link
                to="/routes"
                className="inline-flex items-center justify-center rounded-full border border-[#c8d2c9] bg-white px-5 py-3 text-sm font-bold text-[#1a1c1a]"
              >
                Открыть каталог
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (!hasRouteSelection && !previewRouteId) {
    return (
      <main className="mx-auto max-w-2xl px-6 pb-32 pt-6">
        <section className="rounded-[2rem] border border-[#dfe5dc] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0f5238]">Маршрут</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1a]">Сначала выберите маршрут</h1>
            <p className="text-sm leading-6 text-[#404943]">
              У вас пока нет активного или открытого для просмотра маршрута. Перейдите в каталог и откройте нужный
              маршрут.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/routes"
                className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
              >
                Перейти в каталог
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 pb-32 pt-6">
      <section className="space-y-4">
        <div className="space-y-5 rounded-[2rem] border border-[#dfe5dc] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#0f5238] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  {statusLabel}
                </span>
                <span className="rounded-full bg-[#edf2ec] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#0f5238]">
                  {route.priceLabel}
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1a1c1a]">{route.title}</h1>
                <p className="text-sm leading-6 text-[#404943]">{route.description}</p>
                <p className="text-sm font-medium text-[#404943]">{route.currentLegLabel}</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#f7f8f4] px-4 py-3 text-right">
              <p className="text-2xl font-black text-[#0f5238]">{route.routePoints.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a645d]">точек</p>
            </div>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#e2e3df]">
            <div
              className="h-full rounded-full bg-[#0f5238] shadow-[0_0_12px_rgba(15,82,56,0.2)]"
              style={{ width: `${route.progress}%` }}
            />
          </div>

          {routeActionError ? (
            <div className="rounded-[1.25rem] border border-[#f0c7be] bg-[#fff3f0] px-5 py-4 text-sm font-medium text-[#9b4232]">
              {routeActionError}
            </div>
          ) : null}

          {isPaidLocked ? (
            <div className="rounded-[1.5rem] bg-[#f9faf6] p-5">
              <p className="text-sm leading-6 text-[#404943]">
                Этот маршрут откроется после покупки. После подтверждения оплаты он будет автоматически выбран и сразу
                станет доступен на этом экране.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handlePurchaseRoute()}
                  disabled={isRouteActionLoading}
                  className="rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRouteActionLoading ? 'Покупаем...' : `Купить маршрут за ${route.priceLabel}`}
                </button>
                <Link
                  to="/routes"
                  className="inline-flex items-center justify-center rounded-full border border-[#c8d2c9] bg-white px-5 py-3 text-sm font-bold text-[#1a1c1a]"
                >
                  Вернуться в каталог
                </Link>
              </div>
            </div>
          ) : !route.isActive ? (
            <div className="rounded-[1.5rem] bg-[#f9faf6] p-5">
              <p className="text-sm leading-6 text-[#404943]">
                {isPreview
                  ? 'Это временный просмотр маршрута.'
                  : 'Маршрут доступен, но навигация откроется только после выбора активного маршрута.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSelectRoute()}
                  disabled={isRouteActionLoading}
                  className="rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRouteActionLoading ? 'Выбираем...' : 'Выбрать маршрут'}
                </button>
                {isPreview && hasRouteSelection ? (
                  <button
                    type="button"
                    onClick={() => void handleOpenSelectedRoute()}
                    disabled={isRouteActionLoading}
                    className="rounded-full border border-[#c8d2c9] bg-white px-5 py-3 text-sm font-bold text-[#1a1c1a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Открыть выбранный маршрут
                  </button>
                ) : null}
                <Link
                  to="/routes"
                  className="inline-flex items-center justify-center rounded-full border border-[#c8d2c9] bg-white px-5 py-3 text-sm font-bold text-[#1a1c1a]"
                >
                  Открыть каталог
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {shouldShowMap ? (
        <RouteMap />
      ) : (
        <section className="rounded-[2rem] border border-[#dfe5dc] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#0f5238]">Навигация</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a]">{navigationTitle}</h2>
            <p className="text-sm leading-6 text-[#404943]">{navigationDescription}</p>
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-[#1a1c1a]">Точки маршрута</h2>
          <span className="text-sm font-medium text-[#0f5238]">{route.accessType === 'paid' ? 'Платный' : 'Бесплатный'}</span>
        </div>

        {isCatalogLoading ? (
          <div className="rounded-[1.5rem] bg-[#edf2ec] px-5 py-6 text-sm font-medium text-[#404943]">
            Загружаем маршрут...
          </div>
        ) : null}

        <div className="grid gap-4">
          {route.routePoints.map((routePoint) => {
            const isLocked = routePoint.state === 'locked'

            return (
              <div
                key={routePoint.id}
                className={
                  isLocked
                    ? 'group relative flex items-start gap-3 rounded-lg bg-[#e2e3df]/40 p-3 opacity-80 grayscale-[0.5] sm:items-center sm:gap-4'
                    : 'group relative flex items-start gap-3 rounded-lg bg-[#f3f4f0] p-3 transition-all hover:bg-[#edeeea] sm:items-center sm:gap-4'
                }
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
                  <img alt={routePoint.title} className="h-full w-full object-cover" src={routePoint.image} />
                  {!isLocked ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0f5238]/20">
                      {routePoint.state === 'visited' ? (
                        <MdCheckCircle className="text-2xl text-white sm:text-3xl" />
                      ) : routePoint.kind === 'finish' ? (
                        <MdFlag className="text-2xl text-white sm:text-3xl" />
                      ) : (
                        <MdRadioButtonChecked className="text-2xl text-white sm:text-3xl" />
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <MdLock className="text-2xl text-white sm:text-3xl" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black uppercase text-[#0f5238]">
                      {routePoint.kind === 'finish' ? 'Финиш' : 'QR-точка'}
                    </span>
                    <span
                      className={
                        isLocked
                          ? 'rounded-full bg-[#edeeea] px-2 py-0.5 text-[10px] font-black uppercase text-[#707973]'
                          : 'rounded-full bg-[#cbebc8] px-2 py-0.5 text-[10px] font-black uppercase text-[#0f5238]'
                      }
                    >
                      {routePoint.state === 'locked'
                        ? 'Заблокировано'
                        : routePoint.state === 'active'
                          ? 'Текущая точка'
                          : 'Посещено'}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-bold leading-tight text-[#1a1c1a] sm:text-lg">{routePoint.title}</h3>
                  <p className="text-sm leading-5 text-[#404943]">{routePoint.subtitle}</p>
                </div>

                <div className="ml-auto flex shrink-0 self-center sm:self-auto">
                  {routePoint.kind === 'finish' ? (
                    <MdFlag className="text-xl text-[#bfc9c1] transition-colors group-hover:text-[#0f5238]" />
                  ) : isLocked ? (
                    <MdLock className="text-xl text-[#bfc9c1] transition-colors group-hover:text-[#0f5238]" />
                  ) : routePoint.state === 'active' ? (
                    <MdQrCode2 className="text-xl text-[#bfc9c1] transition-colors group-hover:text-[#0f5238]" />
                  ) : (
                    <MdChevronRight className="text-xl text-[#bfc9c1] transition-colors group-hover:text-[#0f5238]" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
