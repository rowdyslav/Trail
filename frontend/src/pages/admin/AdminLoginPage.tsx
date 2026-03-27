import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useGameStore } from '../../features/game/model/useGameStore'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const adminSession = useGameStore((state) => state.adminSession)
  const loginAdmin = useGameStore((state) => state.loginAdmin)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('trail123')
  const [error, setError] = useState<string | null>(null)

  if (adminSession) {
    return <Navigate to="/admin/redemptions" replace />
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f1] px-6">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_20px_50px_rgba(15,82,56,0.12)]">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a645d]">Admin login</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1a1c1a]">Вход для стойки выдачи</h1>
        <p className="mt-3 text-sm leading-6 text-[#404943]">
          Для MVP используется локальный вход. Тестовые данные уже подставлены в форму.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            const success = loginAdmin(username, password)

            if (!success) {
              setError('Неверный логин или пароль.')
              return
            }

            navigate('/admin/redemptions')
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#404943]">Логин</span>
            <input
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError(null)
              }}
              className="w-full rounded-[1rem] border border-[#d6ddd6] bg-[#f9faf6] px-4 py-3 outline-none focus:border-[#0f5238]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#404943]">Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              className="w-full rounded-[1rem] border border-[#d6ddd6] bg-[#f9faf6] px-4 py-3 outline-none focus:border-[#0f5238]"
            />
          </label>

          {error ? <div className="rounded-[1rem] bg-[#fff1ef] px-4 py-3 text-sm text-[#9b4232]">{error}</div> : null}

          <button
            type="submit"
            className="w-full rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
          >
            Войти
          </button>
        </form>
      </section>
    </main>
  )
}
