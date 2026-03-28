import {Link} from 'react-router-dom'
import {Button} from '../../../shared/ui/Button'
import type {RedemptionRequest} from '../../../shared/types/game'

interface ActiveRedemptionCardProps {
  request: RedemptionRequest
  isCancelling?: boolean
  onCancel?: () => void
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

export function ActiveRedemptionCard({request, isCancelling = false, onCancel}: ActiveRedemptionCardProps) {
  return (
    <section className="rounded-[2rem] bg-[#0f5238] p-6 text-white shadow-[0_20px_50px_rgba(15,82,56,0.18)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">Активная заявка</p>
          <h2 className="mt-3 text-2xl font-extrabold">Покажите этот код администратору</h2>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Заявка создана {dateFormatter.format(new Date(request.createdAt))}. Состав уже зафиксирован и ожидает выдачи.
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/65">Код</p>
          <p className="mt-2 text-2xl font-black tracking-[0.16em]">{request.code}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-[1.5rem] bg-white/10 p-4">
        {request.items.map((item) => (
          <div key={item.prizeId} className="flex items-center justify-between gap-4 text-sm">
            <span>
              {item.titleSnapshot} x {item.quantity}
            </span>
            <span className="font-bold">{item.totalPoints} баллов</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={`/redeem/${request.id}`}
          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0f5238]"
        >
          Открыть код
        </Link>

        {onCancel &&
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isCancelling}
            className="border border-white/20 text-white hover:bg-white/10"
          >
            {isCancelling ? 'Удаляем код...' : 'Удалить текущий код'}
          </Button>
        }
      </div>
    </section>
  )
}
