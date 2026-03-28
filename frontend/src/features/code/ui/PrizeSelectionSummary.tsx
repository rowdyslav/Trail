import { Button } from '../../../shared/ui/Button'

interface PrizeSelectionSummaryProps {
  totalQuantity: number
  totalPoints: number
  balanceAfter: number
  hasActiveRequest: boolean
  canContinue: boolean
  onContinue: () => void
  onReset: () => void
}

export function PrizeSelectionSummary({
  totalQuantity,
  totalPoints,
  balanceAfter,
  hasActiveRequest,
  canContinue,
  onContinue,
  onReset,
}: PrizeSelectionSummaryProps) {
  return (
    <aside className="space-y-4 rounded-[2rem] bg-[#0f5238] p-6 text-white shadow-[0_20px_50px_rgba(15,82,56,0.18)]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">Выбор приза</p>
        <h2 className="mt-3 text-2xl font-extrabold">Сводка заявки</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <div className="rounded-[1.5rem] bg-white/10 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Позиций</p>
          <p className="mt-2 text-3xl font-extrabold">{totalQuantity}</p>
        </div>
        <div className="rounded-[1.5rem] bg-white/10 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">К списанию</p>
          <p className="mt-2 text-3xl font-extrabold">{totalPoints}</p>
        </div>
        <div className="rounded-[1.5rem] bg-white/10 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Останется</p>
          <p className="mt-2 text-3xl font-extrabold">{Math.max(0, balanceAfter)}</p>
        </div>
      </div>

      <p className="text-sm leading-6 text-white/80">
        После подтверждения баллы спишутся сразу, а код выдачи останется в профиле до обработки администратором.
      </p>

      {hasActiveRequest ? (
        <div className="rounded-[1.25rem] border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/85">
          У вас уже есть активная заявка. Пока она не выдана, создать новую нельзя.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onContinue} disabled={!canContinue || hasActiveRequest} className="min-w-48">
          Проверить заявку
        </Button>
        <Button variant="ghost" onClick={onReset} className="text-white">
          Очистить выбор
        </Button>
      </div>
    </aside>
  )
}
