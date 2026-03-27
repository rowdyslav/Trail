import { Link } from 'react-router-dom'
import { MdArrowForward, MdCloudDownload, MdMap, MdMilitaryTech } from 'react-icons/md'
import { useGameStore } from '../../features/game/model/useGameStore'

export function HomePage() {
  const route = useGameStore((state) => state.route)

  return (
    <main className="relative">
        <section className="relative flex min-h-[795px] items-center overflow-hidden bg-[#f9faf6] px-6">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 pt-12 lg:grid-cols-2">
            <div className="order-2 z-10 lg:order-1">
              <h1 className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-[#1a1c1a] md:text-7xl">
                Открой Рязань <br />
                <span className="bg-gradient-to-r from-[#0f5238] to-[#2d6a4f] bg-clip-text text-transparent">
                  через игру

                </span>
              </h1>
              <p className="mb-10 max-w-xl text-lg leading-relaxed text-[#404943] md:text-xl">
                Погрузитесь в историю древнего города с современным цифровым гидом. Квесты, достижения и скрытые тропы Рязанского кремля ждут исследователей.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row mb-4 " >
                <Link
                  to="/route"
                  className="rounded-xl bg-gradient-to-br from-[#0f5238] to-[#2d6a4f] px-10 py-5 text-center text-lg font-bold text-white shadow-[0_4px_0_0_#062318] transition-all hover:opacity-90 active:translate-y-[2px] active:shadow-none"
                >
                  Начать квест

                </Link>
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
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-4xl">
              Геймифицированные маршруты
            </h2>
            <p className="max-w-2xl text-[#404943]">
              Ваше путешествие — это история, где каждый шаг открывает новую главу. Забудьте о скучных путеводителях.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-4">
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-lg bg-[#edeeea] p-8 md:col-span-2">
              <div className="z-10">
                <MdMap className="mb-4 text-3xl text-[#0f5238]" />
                <h3 className="mb-4 text-2xl font-bold">Интерактивная карта</h3>
                <p className="mb-6 max-w-sm text-[#404943]">
                  Следите за своим прогрессом в реальном времени. Скрытые локации открываются только при личном посещении.
                </p>
                <Link to="/route" className="flex items-center gap-2 font-bold text-[#0f5238] transition-all group-hover:gap-4">
                  Исследовать карту
                  <MdArrowForward />
                </Link>
              </div>
            </div>

            <div className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-[#0f5238] p-8 text-white">
              <div className="z-10">
                <h3 className="mb-4 text-2xl font-bold">Сообщество исследователей</h3>
                <p className="mb-8 leading-relaxed text-white/80">
                  Делитесь находками, соревнуйтесь в рейтингах и находите напарников для квестов.
                </p>
              </div>
              <div className="z-10 flex -space-x-3">
                <img className="h-12 w-12 rounded-full border-2 border-[#0f5238]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAl88lZCKY__i_Tb2t74_06Kr_Q0iho1kJn3UK_wafztNkdRzqLQ9Gn7aEVULeiT0Ea5FR-pyLXOSNoczePADrxPglVphvsmfnhImDXXVIpjL9i6LIt5IzmNmn4DhUPTJSiQ8XmiuFjkEASpp4btFFsJ8mu_M_t18v5UL_giWD5aRClDOx2wzAtjD4u-PpmHAFvlYp_hS9A3Tc5BgB_tOQuVdu72-DoSR_4djPUAcLdsMyk0DvTikaCl--G_xAZJlQmkISaIfvhLKeo" alt="Explorer 1" />
                <img className="h-12 w-12 rounded-full border-2 border-[#0f5238]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGnLa-RTvsOE32cO86Qgqm4PtPsTZ-skVajVzXMmZaR7RUQA95dNATB63dFiNOJZR7dX9T8sJ_CCdjO89Lnf6g3kZXgrzm8ulniofTfN8-yLLFJLZ-FjbnEwXROngnUbPVL9e1cRuQyZgFsvnr9PJ5KCNWaeYo9qJ3W0XYg7M9nO0ltA3zqRrFZYRYmTqj9qk-GIfUpSrZ1uK12EMZPVhO4AHNYxdvdUzZJqvHxOwlMhpdCYq4uloIGTOHwe5MKJmogXawADgTZeSW" alt="Explorer 2" />
                <img className="h-12 w-12 rounded-full border-2 border-[#0f5238]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDObuCWHVBptzQ74FfmocbtdOoLSYKk6WVuVxd6Pjxk_SwuBM-DgDMyGZ4CoG5wZAWQJzHqAtTC1l1dnHA8xyVfoSXU74tkjQb0m3laiFBKiuvo4J6QQbpEiBG4BLRG_K6EpQaq_LBI_sSbB8DAdc0yX0lms47jbyisqo1tGjcfjNsN-S2cgJ3JsyLu4zw2PZHFuBgTGmcrMQV1TBysgr_EYTb9lWXjNVzdj4zkKobetbUAFmEa5oZRN9cBjZK9FiqchMDUyf7JM1Yi" alt="Explorer 3" />
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#0f5238] bg-[#2d6a4f] text-xs font-bold">
                  +4k
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-lg bg-[#f3f4f0] p-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#e2e3df]">
                <MdCloudDownload className="text-4xl text-[#0f5238]" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Оффлайн режим</h3>
              <p className="text-sm text-[#404943]">
                Скачайте квест заранее. Работает без интернета в самых отдаленных уголках области.
              </p>
            </div>

            <div className="relative flex items-center justify-between overflow-hidden rounded-lg bg-[#cbebc8] p-8 md:col-span-2">
              <div className="z-10 max-w-md">
                <h3 className="mb-2 text-2xl font-bold text-[#4f6b4f]">Уникальные награды</h3>
                <p className="text-[#4f6b4f] opacity-80">
                  Получайте коллекционные цифровые значки.
                </p>
              </div>
              <div className="z-10 flex h-16 w-20 items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
                <MdMilitaryTech className="text-4xl text-[#0f5238]" />
              </div>
            </div>
          </div>
        </section>
    </main>
  )
}
