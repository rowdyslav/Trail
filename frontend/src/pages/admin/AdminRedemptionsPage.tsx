import { useState } from 'react'
import type { AdminRedemptionValidation } from '../../features/redemption/api/adminRedemptionsApi'
import { useAdminRedemptionStore } from '../../features/redemption/model/useAdminRedemptionStore'

const getStatusMeta = (status: AdminRedemptionValidation['status']) => {
  switch (status) {
    case 'active':
      return {
        label: 'Ожидает выдачи',
        tone: 'bg-[#edf7ee] text-[#0f5238]',
      }
    case 'used':
      return {
        label: 'Уже выдано',
        tone: 'bg-[#eceef3] text-[#44506b]',
      }
    case 'cancelled':
      return {
        label: 'Отменён',
        tone: 'bg-[#fff1ef] text-[#9b4232]',
      }
    default:
      return {
        label: 'Недоступен',
        tone: 'bg-[#fff7e8] text-[#8a5a00]',
      }
  }
}

export function AdminRedemptionsPage() {
  const readAdminRedemptionByCode = useAdminRedemptionStore((state) => state.readAdminRedemptionByCode)
  const confirmRedemptionIssuance = useAdminRedemptionStore((state) => state.confirmRedemptionIssuance)
  const [searchCode, setSearchCode] = useState('')
  const [currentRedemption, setCurrentRedemption] = useState<AdminRedemptionValidation | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const statusMeta = currentRedemption ? getStatusMeta(currentRedemption.status) : null

  const handleLookup = async () => {
    const normalizedCode = searchCode.trim().toUpperCase()

    if (!normalizedCode) {
      setError('Введите redemption code.')
      setCurrentRedemption(null)
      setMessage(null)
      return
    }

    setIsLookingUp(true)
    setError(null)
    setMessage(null)

    const result = await readAdminRedemptionByCode(normalizedCode)

    setIsLookingUp(false)

    if (!result.success || !result.validation) {
      setCurrentRedemption(null)
      setError(result.error ?? 'Не удалось загрузить данные по коду.')
      return
    }

    setCurrentRedemption(result.validation)
  }

  const handleConfirm = async () => {
    if (!currentRedemption) {
      return
    }

    setIsConfirming(true)
    setError(null)
    setMessage(null)

    const result = await confirmRedemptionIssuance({ code: currentRedemption.code })

    setIsConfirming(false)

    if (!result.success || !result.confirmation) {
      setError(result.error ?? 'Не удалось подтвердить выдачу.')
      return
    }

    setCurrentRedemption({
      ...currentRedemption,
      status: result.confirmation.status,
      user: result.confirmation.user,
      items: result.confirmation.items,
      requestedPoints: result.confirmation.deductedPoints,
      canConfirm: false,
    })
    setMessage('Выдача подтверждена.')
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Поиск заявки</p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row">
          <input
            value={searchCode}
            onChange={(event) => {
              setSearchCode(event.target.value)
              setError(null)
              setMessage(null)
            }}
            placeholder="Введите redemption code"
            className="flex-1 rounded-[1.25rem] border border-[#d6ddd6] bg-[#f9faf6] px-5 py-4 text-2xl font-bold uppercase tracking-[0.08em] outline-none focus:border-[#0f5238]"
          />
          <button
            type="button"
            onClick={() => {
              void handleLookup()
            }}
            disabled={isLookingUp}
            className="rounded-[1.25rem] bg-[#0f5238] px-7 py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLookingUp ? 'Ищем...' : 'Найти'}
          </button>
        </div>
        <p className="mt-4 text-base text-[#404943]">
          Сначала пользователь создаёт код в своём разделе, затем администратор проверяет и подтверждает его здесь.
        </p>
      </section>

      <section>
        <div className="rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
          {currentRedemption ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Детали заявки</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-[#1a1c1a]">{currentRedemption.code}</h2>
                </div>
                {statusMeta ? (
                  <span className={`rounded-full px-4 py-2 text-sm font-bold ${statusMeta.tone}`}>{statusMeta.label}</span>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#f9faf6] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Пользователь</p>
                  <p className="mt-2 text-lg font-bold text-[#1a1c1a]">{currentRedemption.user.email}</p>
                  <p className="mt-1 text-sm text-[#404943]">Баланс пользователя: {currentRedemption.user.rewardPoints} очков</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f9faf6] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Списание</p>
                  <p className="mt-2 text-lg font-bold text-[#1a1c1a]">{currentRedemption.requestedPoints} очков</p>
                  <div className="mt-2 space-y-1 text-sm text-[#404943]">
                    {currentRedemption.items.map((item) => (
                      <p key={item.prizeId}>
                        {item.title} x{item.quantity}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-[#f9faf6] p-4 text-sm leading-6 text-[#404943]">
                На этом экране состав заявки не меняется. Администратор только проверяет код и подтверждает факт выдачи.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!currentRedemption.canConfirm || isConfirming}
                  onClick={() => {
                    void handleConfirm()
                  }}
                  className="rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConfirming ? 'Подтверждаем...' : 'Подтвердить выдачу'}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-[#f9faf6] p-6 text-sm leading-6 text-[#404943]">
              Введите redemption code, чтобы открыть заявку и подтвердить выдачу.
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-[1rem] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#9b4232]">{error}</div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-[1rem] bg-[#f3f4f0] px-4 py-3 text-sm font-medium text-[#404943]">{message}</div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

