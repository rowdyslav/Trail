import { Button } from '../../../shared/ui/Button'
import type { RedemptionRequest } from '../../../shared/types/game'

interface AdminRedemptionDetailsCardProps {
  request: RedemptionRequest
  message: string | null
  onConfirmIssuance: () => void
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function AdminRedemptionDetailsCard({
  request,
  message,
  onConfirmIssuance,
}: AdminRedemptionDetailsCardProps) {
  const isIssued = request.status === 'used'

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Детали заявки</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#1a1c1a]">{request.code}</h2>
        </div>
        <span
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            isIssued ? 'bg-[#eceef3] text-[#44506b]' : 'bg-[#edf7ee] text-[#0f5238]'
          }`}
        >
          {isIssued ? 'Выдано' : 'Ожидает выдачи'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] bg-[#f6f8f3] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a645d]">Пользователь</p>
          <p className="mt-2 text-lg font-bold text-[#1a1c1a]">{request.userName}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#f6f8f3] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a645d]">Создано</p>
          <p className="mt-2 text-lg font-bold text-[#1a1c1a]">{dateFormatter.format(new Date(request.createdAt))}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[#f6f8f3] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a645d]">Всего баллов</p>
          <p className="mt-2 text-lg font-bold text-[#0f5238]">{request.totalPoints}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {request.items.map((item) => (
          <div key={item.prizeId} className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-[#dfe5dc] px-4 py-4">
            <div>
              <p className="text-base font-bold text-[#1a1c1a]">{item.titleSnapshot}</p>
              <p className="mt-1 text-sm text-[#404943]">
                {item.quantity} шт. × {item.pointsCostSnapshot} баллов
              </p>
            </div>
            <div className="text-right font-extrabold text-[#0f5238]">{item.totalPoints}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onConfirmIssuance} disabled={isIssued}>
          {isIssued ? 'Заявка уже обработана' : 'Подтвердить выдачу'}
        </Button>
      </div>

      {message ? (
        <div className="mt-4 rounded-[1.25rem] bg-[#f3f4f0] px-4 py-3 text-sm font-medium text-[#404943]">{message}</div>
      ) : null}
    </section>
  )
}

