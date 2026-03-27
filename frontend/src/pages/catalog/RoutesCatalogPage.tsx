import { Link } from 'react-router-dom'
import { useGameStore } from '../../features/game/model/useGameStore'

const sectionMeta = {
  free: {
    title: 'Бесплатные маршруты',
    description: 'Маршруты для первого знакомства с городом и игровым форматом.',
  },
  paid: {
    title: 'Платные маршруты',
    description: 'Премиальные сценарии с дополнительными точками, историей и наградами.',
  },
} as const

export function RoutesCatalogPage() {
  const catalogRoutes = useGameStore((state) => state.catalogRoutes)
  const freeRoutes = catalogRoutes.filter((route) => route.accessType === 'free')
  const paidRoutes = catalogRoutes.filter((route) => route.accessType === 'paid')

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-8 pb-32">
      <section className="rounded-[2rem] bg-[#edf2ec] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Каталог</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1a] sm:text-4xl">
              Маршруты разделены на бесплатные и платные
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#404943]">
              Сохраняем текущий MVP-флоу: активный маршрут остаётся прежним, а каталог помогает пользователю
              выбрать, что проходить дальше.
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
          >
            Перейти к профилю и очкам
          </Link>
        </div>
      </section>

      {([['free', freeRoutes], ['paid', paidRoutes]] as const).map(([key, routes]) => (
        <section key={key} className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">{sectionMeta[key].title}</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a]">{sectionMeta[key].description}</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {routes.map((route) => (
              <article
                key={route.id}
                className="overflow-hidden rounded-[2rem] border border-[#dfe5dc] bg-white shadow-[0_16px_40px_rgba(15,82,56,0.08)]"
              >
                <div className="relative h-52">
                  <img src={route.image} alt={route.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                        route.accessType === 'free'
                          ? 'bg-[#cbebc8] text-[#0f5238]'
                          : 'bg-white/90 text-[#634019]'
                      }`}
                    >
                      {route.accessType === 'free' ? 'Free' : 'Paid'}
                    </span>
                    <span className="rounded-full bg-black/45 px-3 py-1 text-sm font-semibold text-white">
                      {route.priceLabel}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">{route.city}</p>
                    <h3 className="mt-2 text-2xl font-extrabold">{route.title}</h3>
                  </div>
                </div>
                <div className="space-y-5 p-6">
                  <p className="text-sm leading-6 text-[#404943]">{route.description}</p>
                  <div className="flex flex-wrap gap-2 text-sm font-semibold text-[#404943]">
                    <span className="rounded-full bg-[#f3f4f0] px-3 py-2">{route.distanceLabel}</span>
                    <span className="rounded-full bg-[#f3f4f0] px-3 py-2">{route.durationLabel}</span>
                    {route.purchased ? (
                      <span className="rounded-full bg-[#edf7ee] px-3 py-2 text-[#0f5238]">Доступен</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {route.isActive ? (
                      <Link
                        to="/route"
                        className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
                      >
                        Продолжить маршрут
                      </Link>
                    ) : route.purchased ? (
                      <button
                        type="button"
                        className="rounded-full bg-[#edf2ec] px-5 py-3 text-sm font-bold text-[#1a1c1a]"
                      >
                        Открыть позже
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full bg-[#1a1c1a] px-5 py-3 text-sm font-bold text-white"
                      >
                        Купить
                      </button>
                    )}
                    <Link
                      to="/profile"
                      className="inline-flex items-center justify-center rounded-full border border-[#c8d2c9] px-5 py-3 text-sm font-bold text-[#1a1c1a]"
                    >
                      Смотреть очки
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
