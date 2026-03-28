import {useState} from 'react'
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
import {Link} from 'react-router-dom'
import {profileStats, upgradeItems} from '../../entities/quest/model/mockData'
import {useAuthStore} from '../../features/auth/model/useAuthStore'
import {useCodeStore} from '../../features/code/model/useCodeStore'
import {ActiveCodeCard} from '../../features/code/ui/ActiveCodeCard'
import {avatarByStreakKey} from '../../shared/lib/avatarByStreakKey'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const activeCode = useCodeStore((state) => state.getActiveCodeForCurrentUser())
  const logoutUser = useAuthStore((state) => state.logoutUser)
  const clearCodeData = useCodeStore((state) => state.clearCodeData)
  const cancelCurrentCode = useCodeStore((state) => state.cancelCurrentCode)
  const [isCancellingCode, setIsCancellingCode] = useState(false)
  const avatarSrc = avatarByStreakKey[user.streakKey] ?? avatarByStreakKey.novice

  const handleCancelCode = async () => {
    setIsCancellingCode(true)
    await cancelCurrentCode()
    setIsCancellingCode(false)
  }

  return (
    <main className="space-y-8 px-6 pt-8 pb-32">
      <section className="relative flex flex-col items-center justify-center overflow-visible py-10">
        <div
          className="absolute inset-0 -z-10 scale-150 rounded-full bg-gradient-to-b from-[#b1f0ce]/30 to-transparent opacity-50 blur-3xl"
        />
        <div className="group relative">
          <div
            className="h-52 rounded-full border-4 border-black transition-transform duration-500 group-hover:scale-105 md:h-80 md:w-80"
          >
            <img alt="Талисман" className="h-full w-full rounded-full object-contain" src={avatarSrc}/>
          </div>
        </div>

        <div className="mt-2 space-y-2 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a]">{user.title}</h2>
          <div className="flex items-center justify-center gap-2 font-bold text-[#0f5238]">
            <MdLocalFireDepartment className="text-2xl"/>
            <span className="text-lg tracking-wide">Серия: {user.streakDays} дней</span>
          </div>
        </div>
      </section>

      {activeCode ? (
        <ActiveCodeCard
          request={activeCode}
          isCancelling={isCancellingCode}
          onCancel={() => {
            void handleCancelCode()
          }}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-lg bg-[#0f5238] p-6 text-white shadow-[0_16px_30px_rgba(15,82,56,0.18)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold uppercase text-white/70">Баллы наград</p>
              <p className="mt-3 text-4xl font-extrabold">{user.rewardPointsBalance}</p>
            </div>
            <MdStars className="text-4xl text-[#b1f0ce]"/>
          </div>
          <p className="mt-4 text-xl leading-6 text-white/80">
            Баллы можно обменивать на призы, сувениры.
          </p>
          <Link
            to="/redeem"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-[#0f5238]"
          >
            <MdRedeem className="text-lg"/>
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
            {stat.icon === 'castle' ? <MdOutlineCastle className="text-3xl text-[#0f5238]"/> : null}
            {stat.icon === 'directions_walk' ? <MdDirectionsWalk className="text-3xl text-[#0f5238]"/> : null}
            {stat.icon === 'military_tech' ? <MdMilitaryTech className="text-3xl text-[#0f5238]"/> : null}
            <div>
              <div className="text-xl font-extrabold">{stat.value}</div>
              <div
                className="whitespace-pre-line text-[10px] font-bold uppercase leading-tight text-[#404943]"
              >{stat.label}</div>
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
                {upgrade.icon === 'apparel' ? <MdCheckroom className="text-3xl"/> : null}
                {upgrade.icon === 'light' ? <MdLightbulb className="text-3xl"/> : null}
                {upgrade.icon === 'map' ? <MdMap className="text-3xl"/> : null}
                {upgrade.icon === 'lock' ? <MdLock className="text-3xl"/> : null}
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
          <MdAutoAwesome/>
        </Link>
        <Link
          to="/routes"
          className="flex w-full items-center justify-center gap-3 rounded-full border border-[#c8d2c9] bg-white py-5 text-lg font-extrabold text-[#1a1c1a] transition-all hover:bg-[#f3f4f0]"
        >
          Каталог маршрутов
          <MdMilitaryTech/>
        </Link>
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
