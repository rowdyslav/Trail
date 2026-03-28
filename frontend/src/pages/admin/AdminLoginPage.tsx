import {useState} from 'react'
import {Navigate, useNavigate, useSearchParams} from 'react-router-dom'
import {useAdminStore} from '../../features/admin/model/useAdminStore'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const adminSession = useAdminStore((state) => state.adminSession)
  const loginAdmin = useAdminStore((state) => state.loginAdmin)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSessionExpired = searchParams.get('reason') === 'expired'

  if (adminSession) {
    return <Navigate to="/admin/codes" replace/>
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f1] px-6">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_20px_50px_rgba(15,82,56,0.12)]">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#5a645d]">Вход администратора</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1a1c1a]">Стойка выдачи призов</h1>
        <p className="mt-3 text-sm leading-6 text-[#404943]">
          Войдите под администратором, чтобы проверять и подтверждать коды выдачи через backend.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            setIsSubmitting(true)
            const result = await loginAdmin(email, password)
            setIsSubmitting(false)

            if (!result.success) {
              setError(result.error ?? 'Не удалось войти в админ-панель.')
              return
            }

            navigate('/admin/codes')
          }}
        >
          {isSessionExpired &&
            <div
              className="rounded-[1rem] border border-[#f0d7a6] bg-[#fff8e8] px-4 py-3 text-sm font-medium text-[#7a5a12]"
            >
              Срок действия админской сессии истёк. Войдите снова, чтобы продолжить.
            </div>
          }

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
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
          >
            {isSubmitting ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </section>
    </main>
  )
}
