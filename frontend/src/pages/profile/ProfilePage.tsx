import {
  MdAutoAwesome,
  MdCheckroom,
  MdDirectionsWalk,
  MdLightbulb,
  MdLocalFireDepartment,
  MdLock,
  MdMap,
  MdMilitaryTech,
  MdOutlineCastle
} from 'react-icons/md'
import {profileStats, upgradeItems} from '../../entities/quest/model/mockData'
import {useGameStore} from '../../features/game/model/useGameStore'
import {Link} from "react-router-dom";

export function ProfilePage() {
  const user = useGameStore((state) => state.user)

  return (
    <main className="space-y-8 px-6 pt-8 pb-32">
      <section className="relative flex flex-col items-center justify-center overflow-visible py-10">
        <div
          className="absolute inset-0 -z-10 scale-150 rounded-full bg-gradient-to-b from-[#b1f0ce]/30 to-transparent opacity-50 blur-3xl"
        />
        <div className="group relative">
          <div className="h-52  rounded-full border-4 border-black transition-transform duration-500 group-hover:scale-105 md:h-80 md:w-80">
            <img
              alt="Mascot"
              className="h-full w-full rounded-full object-contain drop-shadow-[0_20px_40px_rgba(15,82,56,0.2)]"
              src="/img/гриб1.png"
              // src="https://lh3.googleusercontent.com/aida/ADBb0uhCUxHXTlQGSo5s_CSLsConLyxm3iObTJ_5T8dQ4ni1GgYk25kofzb3zvfr77x_tOfAsdGCUd_nxQ6jwr_vmyOvMi3m_JaXcw9iDNk1pVoZpfCbF_Pj-7rmpQxgYMyOTgK8abeawxraMyl3BGKmmm5UX2zWvLGnqj_E2BA8_URV5LdkKfI9jymhBEcEc4ExM0tQLLtTnYILSlt4FmnrcbfKej2fHpgQ91dNy7EUSc6tsslhICB_ON_DO5k"
            />
          </div>
          <div
            className="absolute text-nowrap -bottom-4 left-1/2 -translate-x-1/2 rounded-full border-4 border-[#f9faf6] bg-[#0f5238] px-6 py-2 font-bold text-white shadow-xl"
          >
            Уровень {user.level}
          </div>
        </div>
        <div className="mt-10 space-y-2 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1c1a]">Младший Проводник</h2>
          <div className="flex items-center justify-center gap-2 font-bold text-[#0f5238]">
            <MdLocalFireDepartment className="text-lg"/>
            <span className="text-xs uppercase tracking-wide">Серия: 2 дня</span>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg bg-[#f3f4f0] p-6">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-sm font-bold uppercase tracking-wider text-[#404943]">Прогресс XP</span>
          <span
            className="text-sm font-bold text-[#0f5238]"
          >{user.xp.toLocaleString('ru-RU')} / {user.nextLevelXp.toLocaleString('ru-RU')}</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-[#e2e3df] p-1">
          <div className="h-full w-[62%] rounded-full bg-[#0f5238] transition-all duration-1000"/>
        </div>
        <p className="text-center text-xs italic text-[#404943]">
          Осталось {(user.nextLevelXp - user.xp).toLocaleString('ru-RU')} XP до уровня «Мастер Путей»
        </p>
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
        <h3 className="text-lg font-bold">Награды и Улучшения</h3>
        <div className="flex gap-4 overflow-x-auto px-6 pb-4 no-scrollbar flex-wrap">
          {upgradeItems.map((upgrade) => (
            <div
              key={upgrade.id}
              className={
                upgrade.locked
                  ? 'flex w-32 shrink-0 flex-col items-center gap-3 rounded-xl bg-[#edeeea] p-4 opacity-50 grayscale '
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

      <section className="pt-4">
        <button
          className="flex w-full items-center justify-center gap-3 rounded-full bg-[#0f5238] py-5 text-lg font-extrabold text-white shadow-[0_4px_0_0_#0a3d29] transition-all active:scale-95"
        >
          <Link to='route'>Продолжить Путь</Link>
          <MdAutoAwesome/>
        </button>
      </section>
    </main>

  )
}
