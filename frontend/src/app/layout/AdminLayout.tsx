import { Outlet, Navigate } from 'react-router-dom'
import { useAdminStore } from '../../features/admin/model/useAdminStore'

export function AdminLayout() {
  const adminSession = useAdminStore((state) => state.adminSession)
  const logoutAdmin = useAdminStore((state) => state.logoutAdmin)

  if (!adminSession) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen bg-[#f4f6f1] text-[#1a1c1a]">
      <header className="border-b border-[#dfe5dc] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#5a645d]">Admin</p>
            <h1 className="text-xl font-extrabold text-[#0f5238]">Kiosk / Code Desk</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logoutAdmin}
              className="rounded-full bg-[#0f5238] px-4 py-2 text-sm font-semibold text-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
