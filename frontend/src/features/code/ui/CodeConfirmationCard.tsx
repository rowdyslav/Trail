import { Button } from '../../../shared/ui/Button'
import type { CodeRequestItem } from '../../../shared/types/game'

interface CodeConfirmationCardProps {
  items: CodeRequestItem[]
  totalPoints: number
  balanceAfter: number
  isSubmitting: boolean
  error: string | null
  onConfirm: () => void
  onBack: () => void
}

export function CodeConfirmationCard({
  items,
  totalPoints,
  balanceAfter,
  isSubmitting,
  error,
  onConfirm,
  onBack,
}: CodeConfirmationCardProps) {
  return (
    <section className="space-y-6 rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)] sm:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Подтверждение</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1a1c1a]">Проверьте состав заявки</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#404943]">
          После нажатия на кнопку баллы спишутся сразу, а код выдачи закрепится за этим набором призов.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.prizeId} className="flex items-center justify-between gap-4 rounded-[1.25rem] bg-[#f6f8f3] px-4 py-4">
            <div>
              <p className="text-base font-bold text-[#1a1c1a]">{item.titleSnapshot}</p>
              <p className="mt-1 text-sm text-[#404943]">
                {item.quantity} шт. × {item.pointsCostSnapshot} баллов
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5a645d]">Итого</p>
              <p className="mt-1 text-lg font-extrabold text-[#0f5238]">{item.totalPoints}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] bg-[#edf2ec] px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a645d]">К списанию</p>
          <p className="mt-2 text-3xl font-extrabold text-[#1a1c1a]">{totalPoints}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#edf7ee] px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a645d]">Останется после заявки</p>
          <p className="mt-2 text-3xl font-extrabold text-[#0f5238]">{Math.max(0, balanceAfter)}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-[1.25rem] border border-[#ecc9c3] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#9b4232]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onConfirm} disabled={isSubmitting}>
          {isSubmitting ? 'Создаём код...' : 'Создать заявку и получить код'}
        </Button>
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
          Вернуться к выбору
        </Button>
      </div>
    </section>
  )
}
