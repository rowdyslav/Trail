import { useGameStore } from '../../game/model/useGameStore'
import { cn } from '../../../shared/lib/cn'
import { Button } from '../../../shared/ui/Button'

export function ScanOverlay() {
  const route = useGameStore((state) => state.route)
  const isOpen = useGameStore((state) => state.isScanOpen)
  const isScanning = useGameStore((state) => state.isScanning)
  const closeScan = useGameStore((state) => state.closeScan)
  const startScan = useGameStore((state) => state.startScan)
  const currentCheckpoint = route.checkpoints.find((checkpoint) => checkpoint.status === 'available')

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 bg-emerald-950/75 backdrop-blur-md">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
        <div className="w-full rounded-[2rem] border border-white/10 bg-[#0f1f1a] p-6 text-white shadow-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
                Scan overlay
              </p>
              <h3 className="mt-3 text-3xl font-black tracking-tight">Подтвердите точку маршрута</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/75">
                MVP-флоу простой: игрок открывает скан, подтверждает присутствие и получает награду без лишних экранов и сетевых зависимостей.
              </p>
            </div>

            <button
              type="button"
              onClick={closeScan}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-emerald-50/75 transition hover:bg-white/10"
            >
              Закрыть
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-[linear-gradient(160deg,_rgba(177,240,206,0.08),_rgba(15,31,26,0.6))] p-6">
              <div className="aspect-[4/5] rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(177,240,206,0.25),_transparent_35%),linear-gradient(180deg,_#173228_0%,_#09110e_100%)] p-5">
                <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-emerald-200/35">
                  <div className="relative flex h-60 w-60 items-center justify-center">
                    <div className="absolute inset-0 rounded-[2rem] border-2 border-emerald-300/40" />
                    <div
                      className={cn(
                        'absolute left-0 right-0 h-1 rounded-full bg-emerald-300 shadow-[0_0_30px_rgba(167,243,208,0.8)]',
                        isScanning ? 'animate-[scan_1.4s_ease-in-out_infinite]' : 'top-1/2',
                      )}
                    />
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Наведи камеру</p>
                      <p className="mt-3 text-2xl font-black">{currentCheckpoint?.title ?? 'Маршрут завершен'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/70">
                Текущая точка
              </p>
              <h4 className="mt-3 text-2xl font-black">{currentCheckpoint?.title ?? 'Все точки собраны'}</h4>
              <p className="mt-2 text-sm text-emerald-50/70">{currentCheckpoint?.subtitle}</p>
              <p className="mt-5 rounded-[1.25rem] bg-white/5 p-4 text-sm leading-6 text-emerald-50/80">
                {currentCheckpoint?.hint ?? 'Откройте новый маршрут на главной, чтобы продолжить прогрессию.'}
              </p>

              <div className="mt-6 rounded-[1.25rem] border border-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">После скана</p>
                <p className="mt-2 text-sm text-emerald-50/80">
                  +{currentCheckpoint?.xp ?? 0} XP, обновление прогресса маршрута и мгновенный показ reward modal.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={startScan}
                  disabled={!currentCheckpoint || isScanning}
                  className="min-w-40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isScanning ? 'Сканирование...' : 'Симулировать скан'}
                </Button>
                <Button variant="ghost" onClick={closeScan} className="text-emerald-50">
                  Вернуться
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
