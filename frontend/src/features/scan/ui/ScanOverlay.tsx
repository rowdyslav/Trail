import { useEffect, useState } from 'react'
import { useRouteProgressStore } from '../../game/model/useRouteProgressStore'
import { getCurrentCheckpoint, getQrCodeValue } from '../model/qrPayload'
import { useScanUiStore } from '../model/useScanUiStore'
import { useQrScanner } from '../model/useQrScanner'
import { cn } from '../../../shared/lib/cn'
import { Button } from '../../../shared/ui/Button'

export function ScanOverlay() {
  const route = useRouteProgressStore((state) => state.route)
  const completeScan = useRouteProgressStore((state) => state.completeScan)
  const isOpen = useScanUiStore((state) => state.isScanOpen)
  const isScanning = useScanUiStore((state) => state.isScanning)
  const storeCloseScan = useScanUiStore((state) => state.closeScan)
  const setScanning = useScanUiStore((state) => state.setScanning)
  const currentCheckpoint = getCurrentCheckpoint(route.checkpoints)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleDetected = (value: string) => {
    if (!isScanning) {
      return
    }

    const result = completeScan(value)

    if (!result.success) {
      setFeedback(result.error ?? 'Не удалось обработать QR-код.')
    }
  }

  const closeScan = () => {
    setFeedback(null)
    storeCloseScan()
  }

  const { videoRef, status, error } = useQrScanner({
    enabled: isOpen && isScanning && Boolean(currentCheckpoint),
    onDetected: handleDetected,
  })

  useEffect(() => {
    if (isOpen && currentCheckpoint) {
      setScanning(true)
    }

    return () => {
      setScanning(false)
    }
  }, [currentCheckpoint, isOpen, setScanning])

  const visibleFeedback = feedback ?? error

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
                При открытии скана приложение сразу запрашивает камеру и начинает искать QR-код текущего
                checkpoint. После успешного считывания прогресс маршрута обновляется автоматически.
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
                <div className="relative flex h-full items-center justify-center overflow-hidden rounded-[1.25rem] border border-dashed border-emerald-200/35">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover transition duration-300',
                      status === 'scanning' ? 'opacity-100' : 'opacity-35',
                    )}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(177,240,206,0.1),_rgba(9,17,14,0.65)_60%)]" />
                  <div className="relative flex h-60 w-60 items-center justify-center">
                    <div className="absolute inset-0 rounded-[2rem] border-2 border-emerald-300/40" />
                    <div
                      className={cn(
                        'absolute left-0 right-0 h-1 rounded-full bg-emerald-300 shadow-[0_0_30px_rgba(167,243,208,0.8)]',
                        isScanning && status === 'scanning' ? 'animate-[scan_1.4s_ease-in-out_infinite]' : 'top-1/2',
                      )}
                    />
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Наведи камеру на QR</p>
                      <p className="mt-3 text-2xl font-black">{currentCheckpoint?.title ?? 'Маршрут завершён'}</p>
                      <p className="mt-3 text-xs text-emerald-100/75">
                        {status === 'starting' && 'Открываем камеру...'}
                        {status === 'scanning' && 'Камера активна, QR будет считан автоматически.'}
                        {status === 'unsupported' && 'Сканирование недоступно в этом браузере.'}
                        {status === 'denied' && 'Нет доступа к камере.'}
                        {status === 'error' && 'Камеру не удалось запустить.'}
                        {status === 'idle' && !currentCheckpoint && 'Все точки уже собраны.'}
                      </p>
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
                  +{currentCheckpoint?.xp ?? 0} XP, обновление прогресса маршрута и мгновенное открытие reward
                  modal.
                </p>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-emerald-300/20 bg-emerald-400/5 p-4 text-sm text-emerald-50/85">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/70">Ожидаемый QR</p>
                <p className="mt-2 break-all font-mono text-xs text-emerald-100/90">
                  {currentCheckpoint ? getQrCodeValue(currentCheckpoint.id) : 'Новый код не требуется'}
                </p>
                <p className="mt-2 text-xs text-emerald-100/70">
                  Допустимы оба формата: `checkpoint.id` или полный URI.
                </p>
              </div>

              {visibleFeedback ? (
                <div className="mt-4 rounded-[1.25rem] border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-50">
                  {visibleFeedback}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    setFeedback(null)
                    setScanning(true)
                  }}
                  disabled={!currentCheckpoint || status === 'starting' || status === 'scanning'}
                  className="min-w-40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'starting' || status === 'scanning' ? 'Камера активна' : 'Повторить скан'}
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
