import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { MdExplore, MdMap, MdMilitaryTech, MdOutlinePerson, MdOutlineQrCodeScanner } from 'react-icons/md'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { useScanUiStore } from '../../features/scan/model/useScanUiStore'
import { RewardModal } from '../../features/rewards/ui/RewardModal'
import { ScanOverlay } from '../../features/scan/ui/ScanOverlay'
import { cn } from '../../shared/lib/cn'

const navItems = [
  { to: '/', label: 'Главная', icon: MdExplore, match: '/' },
  { to: '/routes', label: 'Каталог', icon: MdMap, match: '/routes' },
  { to: '/route', label: 'Маршрут', icon: MdMilitaryTech, match: '/route' },
  { to: '/profile', label: 'Профиль', icon: MdOutlinePerson, match: '/profile' },
]

export function AppShell() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const openScan = useScanUiStore((state) => state.openScan)

  return (
    <div className="min-h-screen bg-[#f9faf6] text-[#1a1c1a]">
      <header className="sticky top-0 z-50 bg-[#f9faf6]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              alt="Mushroom mascot logo"
              className="h-10 w-10 rounded-full object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAleJddpaeDT0cLlKaNsGrWB7XZ7MzGG02R8vApZLdZzgi0UGuKRkSX9h2d5PheoVVj5FIsk3Qsx6XBc1MrWOA6FH849zzv5r1IDuhruVd8TW8elakoKunZweqNbxLi3XP0EmpoLP0uHplr7ZrlWNTLrO8Puw6LBIwAKaFCXPpcEFJcf7IFa48Km2lrGUU2n_Z8ufTeWXjb5z0_ppBoj0TGZu_AP5TbSESW6lY1BVbSPCAyQ9dMu4begjIB3Ay7s8t0n2FpGOeQ4nH9"
            />

            <span className="truncate text-lg font-extrabold tracking-tight text-[#0f5238]">
              Тропа
            </span>
          </Link>

          <div className="shrink-0 rounded-full bg-[#e7e9e5] px-4 py-2 text-sm font-bold text-[#1a1c1a]">
            🔥 {user.streakDays}
          </div>
        </div>
        <div className="h-px w-full bg-[#edeeea]" />
      </header>

      <Outlet />

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[3rem] bg-[#ffffffcc] px-4 pb-6 pt-3 shadow-[0_-8px_32px_rgba(15,82,56,0.06)] backdrop-blur-xl">
        {navItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.match
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center px-5 py-2 text-[#404943] transition-opacity hover:opacity-80',
                isActive && 'translate-y-[-2px] rounded-full bg-[#cbebc8] text-[#0f5238]',
              )}
            >
              <Icon className="text-[24px]" />
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider">{item.label}</span>
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={openScan}
          className="flex flex-col items-center justify-center px-5 py-2 text-[#404943] transition-opacity hover:opacity-80"
        >
          <MdOutlineQrCodeScanner className="text-[24px]" />
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider">Скан</span>
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = location.pathname === item.match
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center px-5 py-2 text-[#404943] transition-opacity hover:opacity-80',
                isActive && 'translate-y-[-2px] rounded-full bg-[#cbebc8] text-[#0f5238]',
              )}
            >
              <Icon className="text-[24px]" />
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <ScanOverlay />
      <RewardModal />
    </div>
  )
}
