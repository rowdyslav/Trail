import type {
  CatalogRoute,
  DailyMission,
  Landmark,
  PrizeCatalogItem,
  ProfileStat,
  RedemptionRequest,
  RouteDetails,
  SuggestedRoute,
  UpgradeItem,
  UserProfile,
} from '../../../shared/types/game'

export const mockRoute: Omit<RouteDetails, 'progress'> = {
  id: 'ryazan-kremlin',
  city: 'Рязань',
  title: 'Прогулка по Рязанскому кремлю',
  description:
    'Небольшой городской маршрут с чекпоинтами, QR-сканированием и наградами в профиле для простого MVP-сценария.',
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
  level: 12,
  xp: 1250,
  rewardPointsBalance: 480,
  streakDays: 12,
  streakKey: 'explorer',
  nextLevelXp: 2000,
  avatarStage: 2,
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

export const prizeCatalog: PrizeCatalogItem[] = [
  {
    id: 'coffee',
    title: 'Кофе в кафе-партнёре',
    description: 'Один горячий напиток из меню партнёра на стойке выдачи.',
    pointsCost: 150,
    isActive: true,
  },
  {
    id: 'stickers',
    title: 'Набор стикеров Trail',
    description: 'Небольшой сувенирный набор с фирменными стикерами.',
    pointsCost: 220,
    isActive: true,
  },
  {
    id: 'premium-discount',
    title: 'Скидка на премиум-маршрут',
    description: 'Скидочный ваучер, который можно применить к платному маршруту.',
    pointsCost: 300,
    isActive: true,
  },
]

export const initialRedemptionRequests: RedemptionRequest[] = []

export const dailyMissions: DailyMission[] = [
  {
    id: 'monuments',
    title: 'Посетить 3 достопримечательности',
    subtitle: 'Выполнено 1/3',
    accent: 'bg-emerald-100 text-emerald-900',
    icon: 'castle',
  },
  {
    id: 'scan-park',
    title: 'Сканировать чекпоинт в парке',
    subtitle: 'Награда: +50 XP',
    accent: 'bg-amber-100 text-amber-900',
    icon: 'camera',
  },
]

export const suggestedRoutes: SuggestedRoute[] = [
  {
    id: 'cathedral-park',
    title: 'Тайны Соборного парка',
    distanceLabel: '450 м отсюда',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'esenin',
    title: 'По следам Есенина',
    distanceLabel: '1,2 км отсюда',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'art-walk',
    title: 'Арт-прогулка',
    distanceLabel: '2,5 км отсюда',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
  },
]

export const landmarks: Landmark[] = [
  {
    id: 'furazhira-gate',
    title: 'Фуражирские ворота',
    subtitle: 'Исторический вход в служебный квартал',
    image: 'https://images.unsplash.com/photo-1514894786521-26d28d4d32c2?auto=format&fit=crop&w=800&q=80',
    state: 'visited',
  },
  {
    id: 'cathedral-complex',
    title: 'Соборный комплекс',
    subtitle: 'Центральная площадь и ключевой чекпоинт маршрута',
    image: 'https://images.unsplash.com/photo-1575908539614-ff89490f4a78?auto=format&fit=crop&w=800&q=80',
    state: 'active',
  },
  {
    id: 'secret-arch',
    title: 'Тайная арка',
    subtitle: 'Скрытая точка за крепостной стеной',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    state: 'locked',
  },
]

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

export const avatarStages = [
  {
    id: 0,
    title: 'Новичок',
    description: 'Первый шаг в городском квесте.',
    accent: 'from-slate-300 to-slate-200',
    ring: 'border-slate-300',
    emoji: 'guide',
  },
  {
    id: 1,
    title: 'Исследователь',
    description: 'Уже уверенно держит темп на маршруте.',
    accent: 'from-emerald-200 to-lime-100',
    ring: 'border-emerald-300',
    emoji: 'explorer',
  },
  {
    id: 2,
    title: 'Проводник',
    description: 'Открывает редкие точки и поддерживает серию.',
    accent: 'from-emerald-400 to-teal-200',
    ring: 'border-emerald-500',
    emoji: 'mushroom',
  },
  {
    id: 3,
    title: 'Мастер маршрута',
    description: 'Финальный этап развития MVP-профиля.',
    accent: 'from-amber-300 to-orange-200',
    ring: 'border-amber-400',
    emoji: 'crown',
  },
] as const

