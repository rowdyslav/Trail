import {
  MdAutoAwesome,
  MdCheckroom,
  MdDirectionsWalk,
  MdLightbulb,
  MdLocalFireDepartment,
  MdLock,
  MdMap,
  MdMilitaryTech,
  MdOutlineCastle,
  MdRedeem,
  MdStars,
} from 'react-icons/md'
import { Link } from 'react-router-dom'
import { profileStats, upgradeItems } from '../../entities/quest/model/mockData'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { useRedemptionStore } from '../../features/redemption/model/useRedemptionStore'
import { ActiveRedemptionCard } from '../../features/redemption/ui/ActiveRedemptionCard'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const activeRedemption = useRedemptionStore((state) => state.getActiveRedemptionForCurrentUser())
  const logoutUser = useAuthStore((state) => state.logoutUser)
  const clearRedemptionData = useRedemptionStore((state) => state.clearRedemptionData)

  return (
    <main className="space-y-8 px-6 pt-8 pb-32">
      <section className="relative flex flex-col items-center justify-center overflow-visible py-10">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-gradient-to-b from-[#b1f0ce]/30 to-transparent opacity-50 blur-3xl" />
        <div className="group relative">
          <div className="h-52 rounded-full border-4 border-black transition-transform duration-500 group-hover:scale-105 md:h-80 md:w-80">
            <img alt="Талисман" className="h-full w-full rounded-full object-contain" src="/img/гриб1.png" />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full border-4 border-[#f9faf6] bg-[#0f5238] px-6 py-2 font-bold text-white shadow-xl">
            Уровень {user.level}
          </div>
        </div>
        <div className="mt-10 space-y-2 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a]">{user.title}</h2>
          <div className="flex items-center justify-center gap-2 font-bold text-[#0f5238]">
            <MdLocalFireDepartment className="text-lg" />
            <span className="text-xs uppercase tracking-wide">Серия: {user.streakDays} дней</span>
          </div>
        </div>
      </section>

      {activeRedemption ? <ActiveRedemptionCard request={activeRedemption} /> : null}

      <section className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4 rounded-lg bg-[#f3f4f0] p-6">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-[#404943]">Прогресс XP</span>
            <span className="text-sm font-bold text-[#0f5238]">
              {user.xp.toLocaleString('ru-RU')} / {user.nextLevelXp.toLocaleString('ru-RU')}
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-[#e2e3df] p-1">
            <div
              className="h-full rounded-full bg-[#0f5238] transition-all duration-1000"
              style={{ width: `${Math.min(100, Math.round((user.xp / user.nextLevelXp) * 100))}%` }}
            />
          </div>
          <p className="text-center text-xs italic text-[#404943]">
            Осталось {(user.nextLevelXp - user.xp).toLocaleString('ru-RU')} XP до следующего уровня
          </p>
        </div>

        <div className="rounded-lg bg-[#0f5238] p-6 text-white shadow-[0_16px_30px_rgba(15,82,56,0.18)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Баллы наград</p>
              <p className="mt-3 text-4xl font-extrabold">{user.rewardPointsBalance}</p>
            </div>
            <MdStars className="text-4xl text-[#b1f0ce]" />
          </div>
          <p className="mt-4 text-sm leading-6 text-white/80">
            Баллы можно обменивать на призы, сувениры и скидки на платные маршруты.
          </p>
          <Link
            to="/redeem"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-[#0f5238]"
          >
            <MdRedeem className="text-lg" />
            Обменять баллы
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {profileStats.map((stat) => (
          <div
            key={stat.id}
            className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-[#edeeea] p-5 text-center transition-colors hover:bg-[#e7e9e5]"
          >
            {stat.icon === 'castle' ? <MdOutlineCastle className="text-3xl text-[#0f5238]" /> : null}
            {stat.icon === 'directions_walk' ? <MdDirectionsWalk className="text-3xl text-[#0f5238]" /> : null}
            {stat.icon === 'military_tech' ? <MdMilitaryTech className="text-3xl text-[#0f5238]" /> : null}
            <div>
              <div className="text-xl font-extrabold">{stat.value}</div>
              <div className="whitespace-pre-line text-[10px] font-bold uppercase leading-tight text-[#404943]">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold">Награды и улучшения</h3>
        <div className="flex flex-wrap gap-4 overflow-x-auto px-1 pb-4 no-scrollbar">
          {upgradeItems.map((upgrade) => (
            <div
              key={upgrade.id}
              className={
                upgrade.locked
                  ? 'flex w-32 shrink-0 flex-col items-center gap-3 rounded-xl bg-[#edeeea] p-4 opacity-50 grayscale'
                  : 'group flex w-32 shrink-0 flex-col items-center gap-3 rounded-xl border border-[#bfc9c1]/20 bg-white p-4 shadow-sm'
              }
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${upgrade.tone}`}>
                {upgrade.icon === 'apparel' ? <MdCheckroom className="text-3xl" /> : null}
                {upgrade.icon === 'light' ? <MdLightbulb className="text-3xl" /> : null}
                {upgrade.icon === 'map' ? <MdMap className="text-3xl" /> : null}
                {upgrade.icon === 'lock' ? <MdLock className="text-3xl" /> : null}
              </div>
              <span className="text-center text-[11px] font-bold leading-tight">{upgrade.title}</span>
            </div>
          ))}
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

      <section className="pt-2">
        <button
          type="button"
          onClick={() => {
            logoutUser()
            clearRedemptionData()
          }}
          className="w-full rounded-full border border-[#d6ddd6] bg-white py-4 text-sm font-bold text-[#1a1c1a] transition hover:bg-[#f3f4f0]"
        >
          Выйти из аккаунта
        </button>
      </section>
    </main>
  )
}
