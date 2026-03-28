import { useEffect } from 'react'
import {
  MdCheckCircle,
  MdErrorOutline,
  MdLockOutline,
  MdRefresh,
  MdStars,
} from 'react-icons/md'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { useActivatePoint } from '../../features/scan/model/useActivatePoint'
import { Button } from '../../shared/ui/Button'

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

export function ActivatePointPage() {
  const { token: tokenParam } = useParams()
  const [searchParams] = useSearchParams()
  const authToken = useAuthStore((state) => state.authToken)
  const isAuthReady = useAuthStore((state) => state.isAuthReady)
  const isAuthLoading = useAuthStore((state) => state.isAuthLoading)
  const updateUser = useAuthStore((state) => state.updateUser)
  const activationToken = tokenParam ?? searchParams.get('token')
  const canActivate = Boolean(activationToken && authToken && isAuthReady && !isAuthLoading)
  const activation = useActivatePoint({
    token: activationToken ?? '',
    authToken: authToken ?? '',
    enabled: canActivate,
  })
  const activationData = activation.data

  useEffect(() => {
    if (!activationData) {
      return
    }

    updateUser((user) => ({
      ...user,
      id: activationData.user.id,
      email: activationData.user.email,
      name: activationData.user.email.split('@')[0] || user.name,
      streakDays: activationData.user.streak_days,
      streakKey: activationData.user.streak_key,
      rewardPointsBalance: activationData.user.reward_points,
    }))
  }, [activationData, updateUser])

  const resolvedState = !isAuthReady || isAuthLoading
    ? 'loading'
    : !activationToken
      ? 'invalid'
      : !authToken
        ? 'unauthorized'
        : activation.state
  const data = canActivate ? activationData : null
  const error = resolvedState === 'invalid'
    ? 'Ссылка активации не содержит токен точки.'
    : resolvedState === 'unauthorized'
      ? 'Войдите в аккаунт, чтобы активировать точку маршрута.'
      : activation.error

  return (
    <main className="mx-auto flex min-h-[calc(100vh-170px)] max-w-3xl items-center px-4 py-8 pb-28 sm:px-6">
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-[#dfe5dc] bg-white shadow-[0_24px_70px_rgba(15,82,56,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(177,240,206,0.32),_transparent_42%)]" />
        <div className="relative px-5 py-6 text-center sm:px-8 sm:py-8">
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#1a1c1a] sm:text-4xl">
            Активация точки по QR-коду
          </h1>

          {resolvedState === 'loading' && (
            <div className="mt-8 rounded-[1.75rem] bg-[#f3f8f3] p-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#0f5238] text-white animate-[activation-pulse_1.8s_ease-in-out_infinite]">
                <MdStars className="text-4xl" />
              </div>
              <p className="mt-5 text-lg font-extrabold text-[#1a1c1a]">Проверяем токен точки</p>
              <p className="mt-2 text-sm text-[#5a645d]">Подождите пару секунд, backend проверяет ссылку и применяет правила маршрута.</p>
            </div>
          )}

          {resolvedState === 'success' && data ? (
            <div className="mt-8 space-y-5">
              <div className="rounded-[1.9rem] bg-[linear-gradient(160deg,#0f5238_0%,#1b7a56_52%,#b1f0ce_160%)] p-6 text-white shadow-[0_24px_60px_rgba(15,82,56,0.22)]">
                <div className="flex flex-col items-center justify-center gap-5 text-center">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/80">
                      <MdCheckCircle className="text-base animate-[activation-pop_520ms_ease-out]" />
                      Точка активирована
                    </div>
                    <h2 className="mt-4 text-3xl font-black tracking-tight">{data.place.title}</h2>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-[1.5rem] bg-[#f4f7f1] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a645d]">Текущая серия</p>
                  <p className="mt-2 text-2xl font-black text-[#0f5238]">{data.user.streak_days}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f4f7f1] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5a645d]">Баллы</p>
                  <p className="mt-2 text-2xl font-black text-[#0f5238]">
                    {data.reward_granted ? `+${data.reward_points_granted}` : '0'}
                  </p>
                  <p className="mt-1 text-xs text-[#404943]">Текущий баланс: {data.user.reward_points}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f4f7f1] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5a645d]">Время</p>
                  <p className="mt-2 text-lg font-semibold text-[#1a1c1a]">
                    {data.completed_at ? dateFormatter.format(new Date(data.completed_at)) : 'Только что'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Link to="/profile" className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white">
                  Открыть профиль
                </Link>
                <Link to="/route" className="inline-flex items-center justify-center rounded-full border border-[#c8d2c9] bg-white px-5 py-3 text-sm font-bold text-[#1a1c1a]">
                  Вернуться к маршруту
                </Link>
              </div>
            </div>
          ) : null}

          {resolvedState === 'duplicate' && data ? (
            <div className="mt-8 rounded-[1.8rem] border border-[#e5d7a6] bg-[#fff8e8] p-6">
              <div className="flex items-start gap-4 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f2dfaa] text-[#8a6110]">
                  <MdRefresh className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-[#1a1c1a]">Точка уже была активирована</h2>
                  <p className="mt-3 text-sm leading-6 text-[#5f562f]">
                    {data.place.title} уже засчитана ранее. Повторная активация не изменила прогресс, но страница корректно отработала ссылку.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                    <Link to="/route" className="inline-flex items-center justify-center rounded-full bg-[#8a6110] px-5 py-3 text-sm font-bold text-white">
                      Открыть маршрут
                    </Link>
                    <Link to="/profile" className="inline-flex items-center justify-center rounded-full border border-[#d8c78e] px-5 py-3 text-sm font-bold text-[#5f562f]">
                      Открыть профиль
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {resolvedState === 'unauthorized' &&
            <div className="mt-8 rounded-[1.8rem] border border-[#d7deea] bg-[#f3f6fb] p-6">
              <div className="flex items-start gap-4 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#44506b] shadow-sm">
                  <MdLockOutline className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-[#1a1c1a]">Сначала войдите в аккаунт</h2>
                  <p className="mt-3 text-sm leading-6 text-[#44506b]">
                    Эта ссылка открывает точку маршрута через backend, поэтому для активации нужен пользовательский аккаунт.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                    <Link
                      to={`/auth?next=${encodeURIComponent(activationToken ? `/activate/${activationToken}` : '/activate')}`}
                      className="inline-flex items-center justify-center rounded-full bg-[#0f5238] px-5 py-3 text-sm font-bold text-white"
                    >
                      Войти и продолжить
                    </Link>
                    <Link to="/" className="inline-flex items-center justify-center rounded-full border border-[#c8d2c9] px-5 py-3 text-sm font-bold text-[#1a1c1a]">
                      На главную
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          }

          {(resolvedState === 'invalid' || resolvedState === 'error') ? (
            <div className="mt-8 rounded-[1.8rem] border border-[#ecc9c3] bg-[#fff1ef] p-6">
              <div className="flex items-start gap-4 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#9b4232] shadow-sm">
                  <MdErrorOutline className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-[#1a1c1a]">
                    {resolvedState === 'invalid' ? 'Ссылка не подходит для активации' : 'Не удалось завершить активацию'}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#7c3b2f]">
                    {error ?? 'Попробуйте открыть ссылку ещё раз или обратиться к администратору маршрута.'}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                    {resolvedState === 'error' ? (
                      <Button variant="secondary" onClick={activation.retry}>Повторить попытку</Button>
                    ) : null}
                    <Link to="/" className="inline-flex items-center justify-center rounded-full border border-[#e0b9b2] px-5 py-3 text-sm font-bold text-[#7c3b2f]">
                      Вернуться в приложение
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
