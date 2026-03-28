import { MdCheckCircle, MdChevronRight, MdLock, MdRadioButtonChecked } from 'react-icons/md'
import { useRouteProgressStore } from '../../features/game/model/useRouteProgressStore'
import { RouteMap } from '../../features/navigation/ui/RouteMap'

export function RoutePage() {
  const route = useRouteProgressStore((state) => state.route)
  const routeLandmarks = useRouteProgressStore((state) => state.routeLandmarks)

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 pb-32 pt-6">
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0f5238] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Маршрут активен
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#1a1c1a]">{route.title}</h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-black text-[#0f5238]">{route.checkpoints.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter text-[#404943]">точек</span>
          </div>
        </div>

        <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#e2e3df]">
          <div
            className="h-full rounded-full bg-[#0f5238] shadow-[0_0_12px_rgba(15,82,56,0.2)]"
            style={{ width: `${route.progress}%` }}
          />
        </div>
      </section>

      <RouteMap />

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-[#1a1c1a]">Точки маршрута</h2>
          <span className="text-sm font-medium text-[#0f5238]">
            {route.accessType === 'paid' ? 'Платный' : 'Бесплатный'}
          </span>
        </div>

        <div className="grid gap-4">
          {routeLandmarks.map((landmark) => (
            <div
              key={landmark.id}
              className={
                landmark.state === 'locked'
                  ? 'group relative flex items-center gap-4 rounded-lg bg-[#e2e3df]/40 p-3 opacity-80 grayscale-[0.5]'
                  : 'group relative flex items-center gap-4 rounded-lg bg-[#f3f4f0] p-3 transition-all hover:bg-[#edeeea]'
              }
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                <img alt={landmark.title} className="h-full w-full object-cover" src={landmark.image} />
                {landmark.state !== 'locked' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0f5238]/20">
                    {landmark.state === 'visited' ? (
                      <MdCheckCircle className="text-3xl text-white" />
                    ) : (
                      <MdRadioButtonChecked className="text-3xl text-white" />
                    )}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    <MdLock className="text-3xl text-white" />
                  </div>
                )}
              </div>

              <div className="flex-grow space-y-1">
                <h3 className="text-lg font-bold text-[#1a1c1a]">{landmark.title}</h3>
                <p className="text-sm text-[#404943]">{landmark.subtitle}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={
                      landmark.state === 'locked'
                        ? 'rounded-full bg-[#edeeea] px-2 py-0.5 text-[10px] font-black uppercase text-[#707973]'
                        : 'rounded-full bg-[#cbebc8] px-2 py-0.5 text-[10px] font-black uppercase text-[#0f5238]'
                    }
                  >
                    {landmark.state === 'locked'
                      ? 'Заблокировано'
                      : landmark.state === 'active'
                        ? 'Текущая точка'
                        : 'Посещено'}
                  </span>
                </div>
              </div>

              {landmark.state === 'locked' ? (
                <MdLock className="text-[#bfc9c1] transition-colors group-hover:text-[#0f5238]" />
              ) : (
                <MdChevronRight className="text-[#bfc9c1] transition-colors group-hover:text-[#0f5238]" />
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
