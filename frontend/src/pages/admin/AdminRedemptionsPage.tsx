import { useMemo, useState } from 'react'
import { useGameStore } from '../../features/game/model/useGameStore'

export function AdminRedemptionsPage() {
  const rewardOptions = useGameStore((state) => state.rewardOptions)
  const user = useGameStore((state) => state.user)
  const findRedemptionByCode = useGameStore((state) => state.findRedemptionByCode)
  const confirmRedemption = useGameStore((state) => state.confirmRedemption)
  const [searchCode, setSearchCode] = useState('')
  const [resolvedCode, setResolvedCode] = useState('')
  const [selectedRewardId, setSelectedRewardId] = useState(rewardOptions[0]?.id ?? '')
  const [customPoints, setCustomPoints] = useState('100')
  const [message, setMessage] = useState<string | null>(null)

  const currentRedemption = useMemo(
    () => (resolvedCode ? findRedemptionByCode(resolvedCode) : null),
    [findRedemptionByCode, resolvedCode],
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-white p-8 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Поиск заявки</p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row">
          <input
            value={searchCode}
            onChange={(event) => {
              setSearchCode(event.target.value)
              setMessage(null)
            }}
            placeholder="Введите redemption code"
            className="flex-1 rounded-[1.25rem] border border-[#d6ddd6] bg-[#f9faf6] px-5 py-4 text-2xl font-bold uppercase tracking-[0.08em] outline-none focus:border-[#0f5238]"
          />
          <button
            type="button"
            onClick={() => {
              setResolvedCode(searchCode)
              setMessage(null)
            }}
            className="rounded-[1.25rem] bg-[#0f5238] px-7 py-4 text-lg font-bold text-white"
          >
            Найти
          </button>
        </div>
        <p className="mt-4 text-base text-[#404943]">Для теста сначала создайте код в пользовательском разделе.</p>
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
                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    currentRedemption.status === 'created' ? 'bg-[#edf7ee] text-[#0f5238]' : 'bg-[#eceef3] text-[#44506b]'
                  }`}
                >
                  {currentRedemption.status === 'created' ? 'Ожидает выдачи' : 'Уже обработан'}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#f9faf6] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Пользователь</p>
                  <p className="mt-2 text-lg font-bold text-[#1a1c1a]">{currentRedemption.userName}</p>
                  <p className="mt-1 text-sm text-[#404943]">Баланс: {user.rewardPointsBalance} очков</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f9faf6] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Запрос</p>
                  <p className="mt-2 text-lg font-bold text-[#1a1c1a]">
                    {currentRedemption.preferredPointsAmount ?? 0} очков
                  </p>
                  <p className="mt-1 text-sm text-[#404943]">
                    Тип: {currentRedemption.kind === 'reward' ? 'Награда' : 'Произвольная сумма'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block rounded-[1.5rem] bg-[#f9faf6] p-4">
                  <span className="mb-2 block text-sm font-semibold text-[#404943]">Выдать готовую награду</span>
                  <select
                    value={selectedRewardId}
                    onChange={(event) => {
                      setSelectedRewardId(event.target.value)
                      setMessage(null)
                    }}
                    className="w-full rounded-[1rem] border border-[#d6ddd6] bg-white px-4 py-3 outline-none focus:border-[#0f5238]"
                  >
                    {rewardOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title} ({option.pointsCost} очков)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block rounded-[1.5rem] bg-[#f9faf6] p-4">
                  <span className="mb-2 block text-sm font-semibold text-[#404943]">Или списать вручную</span>
                  <input
                    type="number"
                    min="1"
                    value={customPoints}
                    onChange={(event) => {
                      setCustomPoints(event.target.value)
                      setMessage(null)
                    }}
                    className="w-full rounded-[1rem] border border-[#d6ddd6] bg-white px-4 py-3 outline-none focus:border-[#0f5238]"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={currentRedemption.status === 'issued'}
                  onClick={() => {
                    const result = confirmRedemption({
                      code: currentRedemption.code,
                      rewardId: selectedRewardId,
                    })
                    setMessage(result.success ? 'Выдача подтверждена.' : result.error ?? 'Не удалось подтвердить выдачу.')
                  }}
                  className="rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Подтвердить выбранную награду
                </button>
                <button
                  type="button"
                  disabled={currentRedemption.status === 'issued'}
                  onClick={() => {
                    const result = confirmRedemption({
                      code: currentRedemption.code,
                      pointsAmount: Number(customPoints),
                    })
                    setMessage(result.success ? 'Списание подтверждено.' : result.error ?? 'Не удалось списать очки.')
                  }}
                  className="rounded-full border border-[#c8d2c9] px-5 py-3 text-sm font-bold text-[#1a1c1a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Подтвердить ручную сумму
                </button>
              </div>

              {message ? (
                <div className="rounded-[1rem] bg-[#f3f4f0] px-4 py-3 text-sm font-medium text-[#404943]">{message}</div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.5rem] bg-[#f9faf6] p-6 text-sm leading-6 text-[#404943]">
              Введите redemption code, чтобы открыть данные пользователя и подтвердить выдачу.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
