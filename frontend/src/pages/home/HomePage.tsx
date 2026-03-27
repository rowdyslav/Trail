import { Link } from 'react-router-dom'
import { MdArrowForward, MdCloudDownload, MdMap, MdMilitaryTech, MdPaid } from 'react-icons/md'
import { useGameStore } from '../../features/game/model/useGameStore'

export function HomePage() {
  const route = useGameStore((state) => state.route)
  const user = useGameStore((state) => state.user)
  const catalogRoutes = useGameStore((state) => state.catalogRoutes)
  const freeCount = catalogRoutes.filter((item) => item.accessType === 'free').length
  const paidCount = catalogRoutes.filter((item) => item.accessType === 'paid').length

  return (
    <main className="relative">
      <section className="relative flex min-h-[760px] items-center overflow-hidden bg-[#f9faf6] px-6">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 py-12 lg:grid-cols-2">
          <div className="order-2 z-10 lg:order-1">
            <h1 className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-[#1a1c1a] md:text-7xl">
              Открой Рязань
              <br />
              <span className="bg-gradient-to-r from-[#0f5238] to-[#2d6a4f] bg-clip-text text-transparent">
                через игру
              </span>
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-[#404943] md:text-xl">
              Квесты, маршруты, QR-чекпоинты и награды. Бесплатные и платные тропы уже собраны в одном каталоге,
              а очки можно обменять прямо в профиле.
            </p>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/route"
                className="rounded-xl bg-gradient-to-br from-[#0f5238] to-[#2d6a4f] px-10 py-5 text-center text-lg font-bold text-white shadow-[0_4px_0_0_#062318] transition-all hover:opacity-90 active:translate-y-[2px] active:shadow-none"
              >
                Продолжить квест
              </Link>
              <Link
                to="/routes"
                className="rounded-xl border border-[#c8d2c9] bg-white px-10 py-5 text-center text-lg font-bold text-[#1a1c1a] transition-all hover:bg-[#f3f4f0]"
              >
                Каталог маршрутов
              </Link>
            </div>

            <div className="grid max-w-xl gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Free</p>
                <p className="mt-2 text-2xl font-extrabold text-[#0f5238]">{freeCount}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Paid</p>
                <p className="mt-2 text-2xl font-extrabold text-[#1a1c1a]">{paidCount}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#5a645d]">Очки</p>
                <p className="mt-2 text-2xl font-extrabold text-[#0f5238]">{user.rewardPointsBalance}</p>
              </div>
            </div>
          </div>

          <div className="order-1 relative lg:order-2">
            <div className="relative z-10 aspect-[4/5] overflow-hidden rounded-lg shadow-2xl lg:rotate-2">
              <img
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSUf0LWBUu36jPFTTPkeI_OJelOCfmOyZlkz-2X_utsbZwKzrY0Oo_qq4_kXjSXZV6AgXPUN_DzVO7xVX-RTt6iQitLQ_utXFTD8sR5Os3g44owU_4UBMAvHWNtQdGmlzJ5Sts8BusrfDImBSVhEy9sU2ShcwzJfEjVOLipXTlkyneHAN8AfqkJd256PW5jPoRjfzZj2p9tf5ijrRM7CIaZW1eleBo7zaGMpm2hA8b-RmtnwNn6R9X-J9KqlUhLdL4PY2XGfSo_MOF"
                alt="Ryazan Kremlin"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="mb-1 text-sm font-medium opacity-80">Текущая цель</p>
                <h3 className="text-2xl font-bold">{route.title}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">Игровые маршруты и обмен очков</h2>
          <p className="max-w-2xl text-[#404943]">
            Сохраняем текущую архитектуру MVP: активный маршрут, карта, профиль и QR-скан. Поверх этого добавлен
            каталог free/paid маршрутов и пользовательский flow выдачи по redemption code.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-lg bg-[#edeeea] p-8 md:col-span-2">
            <div className="z-10">
              <MdMap className="mb-4 text-3xl text-[#0f5238]" />
              <h3 className="mb-4 text-2xl font-bold">Интерактивная карта</h3>
              <p className="mb-6 max-w-sm text-[#404943]">
                Следите за прогрессом маршрута, открывайте QR-точки и получайте XP вместе с reward points.
              </p>
              <Link to="/route" className="flex items-center gap-2 font-bold text-[#0f5238] transition-all group-hover:gap-4">
                Исследовать карту
                <MdArrowForward />
              </Link>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-[#0f5238] p-8 text-white">
            <div className="z-10">
              <h3 className="mb-4 text-2xl font-bold">Баланс наград</h3>
              <p className="mb-6 leading-relaxed text-white/80">
                У тебя уже {user.rewardPointsBalance} очков. Их можно обменять на бонусы или скидку на платные маршруты.
              </p>
              <Link to="/redeem" className="inline-flex rounded-full bg-white px-4 py-3 text-sm font-bold text-[#0f5238]">
                Обменять очки
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg bg-[#f3f4f0] p-8 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e2e3df]">
              <MdCloudDownload className="text-4xl text-[#0f5238]" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Оффлайн режим</h3>
            <p className="text-sm text-[#404943]">Текущий активный маршрут по-прежнему работает в автономном сценарии.</p>
          </div>

          <div className="relative flex items-center justify-between overflow-hidden rounded-lg bg-[#cbebc8] p-8 md:col-span-2">
            <div className="z-10 max-w-md">
              <h3 className="mb-2 text-2xl font-bold text-[#4f6b4f]">Каталог free / paid</h3>
              <p className="text-[#4f6b4f] opacity-80">
                Бесплатные тропы для входа в продукт и платные сценарии для премиального контента теперь разделены явно.
              </p>
            </div>
            <Link
              to="/routes"
              className="z-10 flex h-16 w-20 items-center justify-center rounded-full bg-white/30 text-[#0f5238] backdrop-blur-md"
            >
              <MdPaid className="text-4xl" />
            </Link>
          </div>

          <div className="rounded-lg bg-white p-8 shadow-sm">
            <MdMilitaryTech className="mb-4 text-3xl text-[#0f5238]" />
            <h3 className="mb-2 text-xl font-bold">Награды и коды</h3>
            <p className="text-sm leading-6 text-[#404943]">
              Пользователь создаёт redemption code, а сотрудник подтверждает выдачу награды в отдельной admin-ветке.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
