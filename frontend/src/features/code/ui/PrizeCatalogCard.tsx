import { Button } from '../../../shared/ui/Button'
import type { PrizeCatalogItem } from '../../../shared/types/game'

interface PrizeCatalogCardProps {
  prize: PrizeCatalogItem
  quantity: number
  onDecrement: () => void
  onIncrement: () => void
  disabled?: boolean
}

export function PrizeCatalogCard({
  prize,
  quantity,
  onDecrement,
  onIncrement,
  disabled = false,
}: PrizeCatalogCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-[#dfe5dc] bg-white p-5 shadow-[0_16px_40px_rgba(15,82,56,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-extrabold text-[#1a1c1a]">{prize.title}</p>
          <p className="mt-2 text-sm leading-6 text-[#404943]">{prize.description}</p>
        </div>
        <div className="rounded-full bg-[#edf7ee] px-3 py-2 text-sm font-bold text-[#0f5238]">
          {prize.pointsCost} баллов
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-[1.25rem] bg-[#f6f8f3] px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5a645d]">Количество</p>
          <p className="mt-1 text-sm text-[#404943]">
            {quantity > 0 ? `Выбрано: ${quantity} шт.` : 'Приз ещё не добавлен'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onDecrement} disabled={disabled || quantity <= 0} className="px-4 py-2">
            −
          </Button>
          <div className="min-w-10 text-center text-lg font-extrabold text-[#1a1c1a]">{quantity}</div>
          <Button variant="primary" onClick={onIncrement} disabled={disabled} className="px-4 py-2">
            +
          </Button>
        </div>
      </div>
    </article>
  )
}
