import { useMemo, useState } from 'react'
import { MdAutoAwesome, MdLocalFireDepartment, MdMilitaryTech, MdStars } from 'react-icons/md'
import { Link } from 'react-router-dom'

import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { getCodeDraftSummary } from '../../features/code/lib/getCodeDraftSummary'
import { useCodeStore } from '../../features/code/model/useCodeStore'
import { ActiveCodeCard } from '../../features/code/ui/ActiveCodeCard'
import { PrizeCatalogCard } from '../../features/code/ui/PrizeCatalogCard'
import { PrizeSelectionSummary } from '../../features/code/ui/PrizeSelectionSummary'
import { avatarByStreakKey } from '../../shared/lib/avatarByStreakKey'
import { getRandomMushroomReplica } from '../../shared/lib/mushroomReplica'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const logoutUser = useAuthStore((state) => state.logoutUser)

  const prizeCatalog = useCodeStore((state) => state.prizeCatalog)
  const codeDraftItems = useCodeStore((state) => state.codeDraftItems)
  const isPrizeCatalogLoading = useCodeStore((state) => state.isPrizeCatalogLoading)
  const activeCode = useCodeStore((state) => state.getActiveCodeForCurrentUser())
  const clearCodeData = useCodeStore((state) => state.clearCodeData)
  const clearCodeDraft = useCodeStore((state) => state.clearCodeDraft)
  const setCodeDraftItem = useCodeStore((state) => state.setCodeDraftItem)
  const createCodeRequest = useCodeStore((state) => state.createCodeRequest)
  const cancelCurrentCode = useCodeStore((state) => state.cancelCurrentCode)

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancellingCode, setIsCancellingCode] = useState(false)
  const [mushroomReplica] = useState(() => getRandomMushroomReplica())

  const avatarSrc = avatarByStreakKey[user.streakKey] ?? avatarByStreakKey.novice
  const summary = useMemo(
    () => getCodeDraftSummary(prizeCatalog, codeDraftItems, user.rewardPointsBalance),
    [codeDraftItems, prizeCatalog, user.rewardPointsBalance],
  )

  const getPrizeQuantity = (prizeId: string) => codeDraftItems.find((item) => item.prizeId === prizeId)?.quantity ?? 0

  const handleSetPrizeQuantity = (prizeId: string, quantity: number) => {
    setCodeDraftItem({ prizeId, quantity })
    setError(null)
  }

  const handleGenerateCode = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await createCodeRequest({
      items: summary.items.map((item) => ({
        prizeId: item.prizeId,
        quantity: item.quantity,
      })),
    })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error ?? 'Не удалось создать код.')
    }
  }

  const handleCancelCode = async () => {
    setIsCancellingCode(true)
    setError(null)

    const result = await cancelCurrentCode()

    setIsCancellingCode(false)

    if (!result.success) {
      setError(result.error ?? 'Не удалось отменить код.')
    }
  }

  const handleResetDraft = () => {
    clearCodeDraft()
    setError(null)
  }

  return (
    <main className="space-y-8 px-6 pt-8 pb-32">
      <section className="relative flex flex-col items-center justify-center overflow-visible py-10">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-gradient-to-b from-[#b1f0ce]/30 to-transparent opacity-50 blur-3xl" />

        <div className="group relative flex flex-col items-center">
          <div className="absolute -top-18 right-0 z-10 w-[min(15rem,calc(100vw-2.5rem))] rounded-[1.75rem] border border-[#dfe5dc] bg-white px-4 py-3 text-center shadow-[0_16px_40px_rgba(15,82,56,0.08)] sm:-top-16 sm:left-1/2 sm:right-auto sm:w-[min(18rem,calc(100vw-3rem))] sm:-translate-x-[10%] sm:px-5 sm:py-4 md:-top-10 md:left-[60%] md:w-80 md:-translate-x-0">
            <p className="text-sm font-medium leading-6 text-[#404943]">{mushroomReplica}</p>
            <div className="absolute right-8 top-full h-4 w-4 -translate-y-1/2 rotate-45 border-r border-b border-[#dfe5dc] bg-white sm:left-10 sm:right-auto" />
          </div>

          <div className="size-52 overflow-hidden rounded-full border-4 border-black bg-white shadow-[0_16px_40px_rgba(15,82,56,0.08)] transition-transform duration-500 group-hover:scale-105 md:size-80">
            <img alt="Талисман" className="h-full w-full object-contain" src={avatarSrc} />
          </div>
        </div>

        <div className="mt-2 space-y-2 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a]">{user.title}</h2>
          <div className="flex items-center justify-center gap-2 font-bold text-[#0f5238]">
            <MdLocalFireDepartment className="text-2xl" />
            <span className="text-lg tracking-wide">Серия: {user.streakDays} дней</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          to="/route"
          className="flex w-full items-center justify-center gap-3 rounded-full bg-[#0f5238] py-5 text-lg font-extrabold text-white shadow-[0_4px_0_0_#0a3d29] transition-all active:scale-95"
        >
          Продолжить путь
          <MdAutoAwesome />
        </Link>
        <Link
          to="/routes"
          className="flex w-full items-center justify-center gap-3 rounded-full border border-[#c8d2c9] bg-white py-5 text-lg font-extrabold text-[#1a1c1a] transition-all hover:bg-[#f3f4f0]"
        >
          Каталог маршрутов
          <MdMilitaryTech />
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_16px_40px_rgba(15,82,56,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Каталог призов</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1a1c1a]">
              Выберите призы и получите код
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#404943]">
              Ниже можно выбрать несколько призов, настроить количество и сразу сгенерировать код для получения у
              администратора.
            </p>
          </div>

          <div className="rounded-lg bg-[#0f5238] p-6 text-white shadow-[0_16px_30px_rgba(15,82,56,0.18)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold uppercase text-white/70">Баллы</p>
                <p className="mt-3 text-4xl font-extrabold">{user.rewardPointsBalance}</p>
              </div>
              <MdStars className="text-4xl text-[#b1f0ce]" />
            </div>
            <p className="mt-4 text-xl leading-6 text-white/80">
              Баллы можно обменять на призы и сразу получить код выдачи в профиле.
            </p>
          </div>

          {isPrizeCatalogLoading ? (
            <div className="rounded-[2rem] border border-[#dfe5dc] bg-[#f9faf6] p-5 text-sm font-medium text-[#5a645d]">
              Загружаем каталог призов...
            </div>
          ) : null}

          {!isPrizeCatalogLoading && !prizeCatalog.length ? (
            <div className="rounded-[2rem] border border-[#dfe5dc] bg-[#f9faf6] p-5 text-sm font-medium text-[#5a645d]">
              Каталог призов пока недоступен.
            </div>
          ) : null}

          {!isPrizeCatalogLoading &&
            prizeCatalog.map((prize) => {
              const quantity = getPrizeQuantity(prize.id)

              return (
                <PrizeCatalogCard
                  key={prize.id}
                  prize={prize}
                  quantity={quantity}
                  disabled={isSubmitting}
                  onDecrement={() => handleSetPrizeQuantity(prize.id, quantity - 1)}
                  onIncrement={() => handleSetPrizeQuantity(prize.id, quantity + 1)}
                />
              )
            })}
        </div>

        <div className="space-y-4">
          {activeCode ? (
            <ActiveCodeCard
              request={activeCode}
              isCancelling={isCancellingCode}
              onCancel={() => {
                void handleCancelCode()
              }}
            />
          ) : null}

          <PrizeSelectionSummary
            totalQuantity={summary.totalQuantity}
            totalPoints={summary.totalPoints}
            balanceAfter={summary.balanceAfter}
            hasActiveRequest={Boolean(activeCode)}
            canContinue={summary.items.length > 0 && summary.balanceAfter >= 0}
            onContinue={() => {
              void handleGenerateCode()
            }}
            onReset={handleResetDraft}
          />

          {summary.balanceAfter < 0 ? (
            <div className="rounded-[1.5rem] border border-[#ecc9c3] bg-[#fff1ef] px-5 py-4 text-sm font-medium text-[#9b4232]">
              Недостаточно баллов для выбранного набора призов.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[1.5rem] border border-[#ecc9c3] bg-[#fff1ef] px-5 py-4 text-sm font-medium text-[#9b4232]">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <section className="pt-2">
        <button
          type="button"
          onClick={() => {
            logoutUser()
            clearCodeData()
          }}
          className="w-full rounded-full border border-[#d6ddd6] bg-white py-4 text-sm font-bold text-[#1a1c1a] transition hover:bg-[#f3f4f0]"
        >
          Выйти из аккаунта
        </button>
      </section>
    </main>
  )
}
