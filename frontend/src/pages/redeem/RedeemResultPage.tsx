import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useRedemptionStore } from '../../features/redemption/model/useRedemptionStore'
import { Button } from '../../shared/ui/Button'

export function RedeemResultPage() {
  const navigate = useNavigate()
  const { requestId = '' } = useParams()
  const request = useRedemptionStore((state) => state.getRedemptionById(requestId))
  const cancelCurrentRedemption = useRedemptionStore((state) => state.cancelCurrentRedemption)
  const isActive = request?.status === 'active'
  const [isCancelling, setIsCancelling] = useState(false)

  if (!request) {
    return <Navigate to="/redeem" replace />
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    const result = await cancelCurrentRedemption()
    setIsCancelling(false)

    if (result.success) {
      navigate('/redeem', { replace: true })
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-8 pb-32">
      <section className="rounded-[2rem] bg-[#0f5238] p-6 text-white shadow-[0_20px_50px_rgba(15,82,56,0.18)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">Redemption code</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Покажите этот код сотруднику</h1>
        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-white/70">Код</p>
          <p className="mt-3 break-all text-4xl font-black tracking-[0.18em]">{request.code}</p>
        </div>
      </section>

      <section className="grid gap-5 rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)] sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Позиции заявки</p>
          <div className="mt-2 space-y-2">
            {request.items.map((item) => (
              <p key={item.prizeId} className="text-lg font-bold text-[#1a1c1a]">
                {item.titleSnapshot} x{item.quantity}
              </p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Сумма списания</p>
          <p className="mt-2 text-lg font-bold text-[#1a1c1a]">{request.totalPoints}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Статус</p>
          <p
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
              isActive ? 'bg-[#edf7ee] text-[#0f5238]' : 'bg-[#eceef3] text-[#44506b]'
            }`}
          >
            {isActive ? 'Ожидает подтверждения' : 'Выдано'}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Инструкция</p>
          <p className="mt-2 text-sm leading-6 text-[#404943]">
            Сотрудник найдёт заявку по коду, сверит состав заказа и подтвердит выдачу на админ-экране.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/profile"
          className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
        >
          Вернуться в профиль
        </Link>
        <Link
          to="/redeem"
          className="inline-flex items-center justify-center rounded-full border border-[#c8d2c9] px-5 py-3 text-sm font-bold text-[#1a1c1a]"
        >
          Создать новый код
        </Link>
        {isActive ? (
          <Button variant="secondary" onClick={() => void handleCancel()} disabled={isCancelling}>
            {isCancelling ? 'Удаляем код...' : 'Удалить текущий код'}
          </Button>
        ) : null}
      </div>
    </main>
  )
}
