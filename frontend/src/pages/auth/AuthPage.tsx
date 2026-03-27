import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useGameStore } from '../../features/game/model/useGameStore'

type AuthMode = 'login' | 'register'

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const authToken = useGameStore((state) => state.authToken)
  const isAuthLoading = useGameStore((state) => state.isAuthLoading)
  const loginUser = useGameStore((state) => state.loginUser)
  const registerUser = useGameStore((state) => state.registerUser)
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const nextPath = searchParams.get('next') || '/profile'

  if (authToken) {
    return <Navigate to={nextPath} replace />
  }

  const submit = async () => {
    setError(null)

    if (!email.trim() || password.length < 6) {
      setError('Введите email и пароль не короче 6 символов.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const result = mode === 'login' ? await loginUser(normalizedEmail, password) : await registerUser(normalizedEmail, password)

    if (!result.success) {
      setError(result.error ?? 'Не удалось выполнить запрос.')
      return
    }

    navigate(nextPath, { replace: true })
  }

  return (
    <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-[2rem] border border-[#dfe5dc] bg-white p-8 shadow-[0_20px_50px_rgba(15,82,56,0.12)]">
        <h1 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-[#1a1c1a]">
          {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
        </h1>

        <div className="mt-6 flex rounded-full bg-[#edf2ec] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-bold ${
              mode === 'login' ? 'bg-[#0f5238] text-white' : 'text-[#1a1c1a]'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError(null)
            }}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-bold ${
              mode === 'register' ? 'bg-[#0f5238] text-white' : 'text-[#1a1c1a]'
            }`}
          >
            Регистрация
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-[#404943]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError(null)
              }}
              className="w-full rounded-[1rem] border border-[#d6ddd6] bg-[#f9faf6] px-4 py-3 outline-none focus:border-[#0f5238]"
              placeholder="name@example.com"
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
              placeholder="Минимум 6 символов"
            />
          </label>

          {error ? (
            <div className="rounded-[1rem] border border-[#ecc9c3] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#9b4232]">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void submit()
            }}
            disabled={isAuthLoading}
            className="w-full rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAuthLoading ? 'Подождите...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-[#404943]">
          <Link to="/" className="font-bold text-[#0f5238]">
            Вернуться на главную
          </Link>
        </div>
      </section>
    </main>
  )
}
