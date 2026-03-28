import type { CatalogRoute, ProfileStat, RedemptionRequest, RouteDetails, UpgradeItem, UserProfile } from '../../../shared/types/game'

export const mockRoute: Omit<RouteDetails, 'progress'> = {
  id: 'ryazan-kremlin',
  city: 'Рязань',
  title: 'Прогулка по Рязанскому кремлю',
  description:
    'Небольшой городской маршрут с чекпоинтами, QR-сканированием и наградами в профиле для простого MVP-сценария.',
  accessType: 'free',
  currentLegLabel: 'От собора к смотровой у крепостной стены',
  estimatedTime: '35 мин',
  distance: '2,4 км',
  checkpoints: [
    {
      id: 'cathedral',
      title: 'Успенский собор',
      subtitle: 'Старт маршрута',
      hint: 'Подойдите к западному фасаду и найдите табличку с датой освящения.',
      storyBeat: 'Маршрут начинается у главной достопримечательности кремля и задаёт исторический контекст.',
      xp: 120,
      status: 'completed',
      reward: {
        title: 'Награда: Первый шаг',
        description: 'Вы открыли первую главу маршрута и запустили серию исследователя.',
      },
    },
    {
      id: 'cathedral-square',
      title: 'Соборная площадь',
      subtitle: 'Текущая точка',
      hint: 'Наведите камеру на схему площади у колокольни.',
      storyBeat: 'Эта остановка объясняет, куда маршрут идёт дальше, и даёт сюжетный переход.',
      xp: 160,
      status: 'available',
      reward: {
        title: 'Награда: Хранитель площади',
        description: 'Открывается новый фрагмент истории, и вы получаете +160 XP.',
      },
    },
    {
      id: 'viewpoint',
      title: 'Смотровая у стены',
      subtitle: 'Финал маршрута',
      hint: 'После площади маршрут ведёт к крепостной стене с финальной панорамой.',
      storyBeat: 'Финальная точка замыкает MVP-цикл: прогулка, сканирование, награда и рост профиля.',
      xp: 220,
      status: 'locked',
      reward: {
        title: 'Финал: Панорама Рязани',
        description: 'Финальная награда маршрута и новый этап развития аватара.',
      },
    },
  ],
}

export const mockUser: UserProfile = {
  id: 'user-explorer-ryazan',
  name: 'Исследователь Рязани',
  title: 'Старший проводник',
  rewardPointsBalance: 480,
  streakDays: 12,
  streakKey: 'explorer',
  badges: [
    { id: 'story', title: 'Любитель истории', tone: 'bg-amber-100 text-amber-900' },
    { id: 'walker', title: '24 локации', tone: 'bg-emerald-100 text-emerald-900' },
    { id: 'streak', title: 'Серия 12 дней', tone: 'bg-sky-100 text-sky-900' },
  ],
}

export const catalogRoutes: CatalogRoute[] = [
  {
    id: 'ryazan-kremlin',
    city: 'Рязань',
    title: 'Прогулка по Рязанскому кремлю',
    description: 'Короткий городской квест с чекпоинтами, QR-сканированием и наградами.',
    distanceLabel: '2,4 км',
    durationLabel: '35 мин',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
    accessType: 'free',
    priceLabel: 'Free',
    purchased: true,
    isActive: true,
  },
  {
    id: 'cathedral-park',
    city: 'Рязань',
    title: 'Тайны Соборного парка',
    description: 'Лёгкий маршрут для первого знакомства с продуктом и игровой механикой.',
    distanceLabel: '1,8 км',
    durationLabel: '25 мин',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
    accessType: 'free',
    priceLabel: 'Free',
    purchased: true,
  },
  {
    id: 'esenin-premium',
    city: 'Константиново',
    title: 'По следам Есенина',
    description: 'Премиальный маршрут с дополнительными сюжетными точками и наградами.',
    distanceLabel: '4,1 км',
    durationLabel: '65 мин',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
    accessType: 'paid',
    priceLabel: '399 ₽',
    purchased: false,
  },
  {
    id: 'art-walk-premium',
    city: 'Рязань',
    title: 'Арт-прогулка',
    description: 'Платный маршрут с современными городскими точками и дополнительными историями.',
    distanceLabel: '3,2 км',
    durationLabel: '50 мин',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    accessType: 'paid',
    priceLabel: '250 points',
    pricePoints: 250,
    purchased: true,
  },
]

export const initialRedemptionRequests: RedemptionRequest[] = []

export const profileStats: ProfileStat[] = [
  { id: 'visited', label: 'Локаций\nпосещено', value: '24', icon: 'castle' },
  { id: 'walked', label: 'Километров\nпройдено', value: '86,4', icon: 'directions_walk' },
  { id: 'rewards', label: 'Редких\nнаград', value: '12', icon: 'military_tech' },
]

export const upgradeItems: UpgradeItem[] = [
  { id: 'hat', title: 'Новая шляпа', icon: 'apparel', tone: 'bg-[#cbebc8] text-[#0f5238]' },
  { id: 'lantern', title: 'Золотой фонарь', icon: 'light', tone: 'bg-[#ffdcbd] text-[#634019]' },
  { id: 'map', title: 'Древняя карта', icon: 'map', tone: 'bg-[#b1f0ce] text-[#0f5238]' },
  { id: 'locked', title: 'Уровень 15', icon: 'lock', tone: 'bg-[#e2e3df] text-[#707973]', locked: true },
]
