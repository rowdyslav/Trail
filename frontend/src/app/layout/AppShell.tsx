import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { MdExplore, MdMap, MdMilitaryTech, MdOutlinePerson } from 'react-icons/md'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
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
  const authToken = useAuthStore((state) => state.authToken)

  return (
    <div className="min-h-screen bg-[#f9faf6] text-[#1a1c1a]">
      <header className="sticky top-0 z-50 bg-[#f9faf6]/95 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              alt="Mushroom mascot logo"
              className="h-12 w-12 rounded-full object-contain"
              src="/img/mushrooms/logo.png"
            />

            <span className="truncate text-2xl font-extrabold tracking-tight text-[#0f5238]">
              Тропа
            </span>
          </Link>

          {authToken ? (
            <div className="shrink-0 rounded-full bg-[#e7e9e5] px-4 py-2 text-sm font-bold text-[#1a1c1a]">
              🔥 {user.streakDays}
            </div>
          ) : (
            <Link
              to="/auth"
              className="shrink-0 rounded-full bg-[#0f5238] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              Войти
            </Link>
          )}
        </div>
        <div className="h-px w-full bg-[#edeeea]" />
      </header>

      <Outlet />

      <nav className="fixed inset-x-0 bottom-0 z-50 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4 md:px-0 md:pt-0 md:pb-0">
        <div className="mx-auto flex w-full max-w-md items-center gap-1 rounded-[2rem] border border-white/70 bg-[#ffffffd9] px-2 py-2 shadow-[0_-8px_32px_rgba(15,82,56,0.06)] backdrop-blur-xl md:max-w-none md:justify-around md:rounded-t-[3rem] md:rounded-b-none md:border-x-0 md:border-b-0 md:px-6 md:pb-6 md:pt-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.match
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex min-w-0 flex-1 items-center justify-center text-[#404943] transition-opacity hover:opacity-80"
              >
                <span
                  className={cn(
                    'flex min-w-0 flex-col items-center justify-center rounded-[1.2rem] px-3 py-2 sm:px-4',
                    isActive && 'translate-y-[-2px] bg-[#cbebc8] text-[#0f5238]',
                  )}
                >
                  <Icon className="text-[22px] sm:text-[24px]" />
                  <span className="mt-1 max-w-full truncate text-center text-[10px] font-semibold tracking-[0.12em] sm:text-[11px]">
                    {item.label}
                  </span>
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
