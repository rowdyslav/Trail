import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGameStore } from '../../features/game/model/useGameStore'
import { Button } from '../../shared/ui/Button'

export function RedeemPage() {
  const navigate = useNavigate()
  const user = useGameStore((state) => state.user)
  const rewardOptions = useGameStore((state) => state.rewardOptions)
  const createRedemptionRequest = useGameStore((state) => state.createRedemptionRequest)
  const [selectedRewardId, setSelectedRewardId] = useState<string>(rewardOptions[0]?.id ?? '')
  const [customPoints, setCustomPoints] = useState('100')
  const [error, setError] = useState<string | null>(null)

  const handleRewardRequest = () => {
    const request = createRedemptionRequest({ rewardId: selectedRewardId })

    if (!request) {
      setError('Не удалось создать запрос. Проверьте баланс очков.')
      return
    }

    navigate(`/redeem/${request.id}`)
  }

  const handleCustomRequest = () => {
    const request = createRedemptionRequest({ pointsAmount: Number(customPoints) })

    if (!request) {
      setError('Не удалось создать запрос. Проверьте сумму и баланс очков.')
      return
    }

    navigate(`/redeem/${request.id}`)
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-8 pb-32">
      <section className="rounded-[2rem] bg-[#edf2ec] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Обмен очков</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1a]">Сформируйте код для выдачи награды</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#404943]">
              Пользователь создаёт заявку, получает код и показывает его сотруднику. Само списание очков происходит
              только после подтверждения на админ-экране.
            </p>
          </div>
          <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Баланс</p>
            <p className="mt-1 text-3xl font-extrabold text-[#0f5238]">{user.rewardPointsBalance}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4 rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Готовые награды</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#1a1c1a]">Выберите шаблон обмена</h2>
          </div>

          <div className="space-y-3">
            {rewardOptions.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-[1.5rem] border p-4 ${
                  selectedRewardId === option.id ? 'border-[#0f5238] bg-[#edf7ee]' : 'border-[#dfe5dc] bg-[#f9faf6]'
                }`}
              >
                <div>
                  <p className="text-lg font-bold text-[#1a1c1a]">{option.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#404943]">{option.description}</p>
                </div>
                <div className="text-right">
                  <input
                    type="radio"
                    name="rewardOption"
                    value={option.id}
                    checked={selectedRewardId === option.id}
                    onChange={(event) => {
                      setSelectedRewardId(event.target.value)
                      setError(null)
                    }}
                    className="mt-1 h-4 w-4 accent-[#0f5238]"
                  />
                  <p className="mt-3 text-sm font-bold text-[#0f5238]">{option.pointsCost} очков</p>
                </div>
              </label>
            ))}
          </div>

          <Button onClick={handleRewardRequest}>Сформировать код для награды</Button>
        </div>

        <div className="space-y-4 rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Свободная сумма</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[#1a1c1a]">Передать код на частичное списание</h2>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#404943]">Сколько очков подготовить к списанию</span>
            <input
              type="number"
              min="1"
              max={user.rewardPointsBalance}
              value={customPoints}
              onChange={(event) => {
                setCustomPoints(event.target.value)
                setError(null)
              }}
              className="w-full rounded-[1rem] border border-[#d6ddd6] bg-[#f9faf6] px-4 py-3 text-base outline-none focus:border-[#0f5238]"
            />
          </label>

          <Button variant="secondary" onClick={handleCustomRequest}>
            Создать код на произвольную сумму
          </Button>

          <p className="text-sm leading-6 text-[#404943]">
            Подходит для скидки, доплаты или ручного выбора награды сотрудником на стойке.
          </p>
          <Link to="/admin/login" className="inline-flex text-sm font-bold text-[#0f5238]">
            Открыть админ-вход
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-[1.5rem] border border-[#ecc9c3] bg-[#fff1ef] px-5 py-4 text-sm font-medium text-[#9b4232]">
          {error}
        </div>
      ) : null}
    </main>
  )
}
