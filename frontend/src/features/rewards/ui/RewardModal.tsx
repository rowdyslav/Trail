import { useGameStore } from '../../game/model/useGameStore'
import { Button } from '../../../shared/ui/Button'

export function RewardModal() {
  const reward = useGameStore((state) => state.activeReward)
  const closeReward = useGameStore((state) => state.closeReward)

  if (!reward) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-xl items-center">
        <div className="w-full rounded-[2rem] bg-white p-8 shadow-[0_30px_100px_rgba(15,23,42,0.25)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-100 text-4xl">
            🏆
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700/70">
              Reward modal
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{reward.title}</h3>
            <p className="mt-4 text-base leading-7 text-slate-600">{reward.description}</p>
            <div className="mt-6 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-950">
              +{reward.xp} XP
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button onClick={closeReward}>Продолжить маршрут</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
