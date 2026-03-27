import type {
  CatalogRoute,
  DailyMission,
  Landmark,
  ProfileStat,
  RedemptionRequest,
  RewardOption,
  RouteDetails,
  SuggestedRoute,
  UpgradeItem,
  UserProfile,
} from '../../../shared/types/game'

export const mockRoute: Omit<RouteDetails, 'progress'> = {
  id: 'ryazan-kremlin',
  city: 'Рязань',
  title: 'Прогулка по Рязанскому Кремлю',
  description:
    'Компактный городской маршрут по Кремлю: короткие остановки, история в формате квеста и понятный MVP-флоу без лишней механики.',
  currentLegLabel: 'От Успенского собора до смотровой у вала',
  estimatedTime: '35 минут',
  distance: '2.4 км',
  checkpoints: [
    {
      id: 'cathedral',
      title: 'Успенский собор',
      subtitle: 'Старт маршрута',
      hint: 'Подойдите к западному фасаду и найдите табличку с датой освящения.',
      storyBeat: 'Маршрут начинается у главной доминанты Кремля и задаёт исторический контекст прогулки.',
      xp: 120,
      status: 'completed',
      reward: {
        title: 'Бейдж "Первый след"',
        description: 'Вы открыли стартовую главу маршрута и запустили серию исследователя.',
      },
    },
    {
      id: 'cathedral-square',
      title: 'Соборная площадь',
      subtitle: 'Текущая точка',
      hint: 'Наведите камеру на план площади возле колокольни.',
      storyBeat: 'Здесь игрок понимает, куда ведёт маршрут дальше, и получает главный сюжетный переход.',
      xp: 160,
      status: 'available',
      reward: {
        title: 'Награда "Хранитель площади"',
        description: 'Открыт новый фрагмент истории и +160 XP к прогрессу профиля.',
      },
    },
    {
      id: 'viewpoint',
      title: 'Смотровая у вала',
      subtitle: 'Финал маршрута',
      hint: 'После площади маршрут поведёт к валу, где откроется финальная панорама.',
      storyBeat: 'Финальная точка завершает MVP-цикл: пройти, сканировать, получить награду.',
      xp: 220,
      status: 'locked',
      reward: {
        title: 'Финал "Панорама Рязани"',
        description: 'Финальная награда маршрута и новый этап роста аватара.',
      },
    },
  ],
}

export const mockUser: UserProfile = {
  id: 'user-explorer-ryazan',
  name: 'Explorer Ryazan',
  title: 'Старший проводник',
  level: 12,
  xp: 1250,
  rewardPointsBalance: 480,
  streakDays: 12,
  nextLevelXp: 2000,
  avatarStage: 2,
  badges: [
    { id: 'story', title: 'Знаток истории', tone: 'bg-amber-100 text-amber-900' },
    { id: 'walker', title: '24 локации', tone: 'bg-emerald-100 text-emerald-900' },
    { id: 'streak', title: 'Серия 12 дней', tone: 'bg-sky-100 text-sky-900' },
  ],
}

export const catalogRoutes: CatalogRoute[] = [
  {
    id: 'ryazan-kremlin',
    city: 'Рязань',
    title: 'Прогулка по Рязанскому Кремлю',
    description: 'Короткий городской квест с checkpoint-механикой, QR-сканированием и наградами.',
    distanceLabel: '2.4 км',
    durationLabel: '35 минут',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
    accessType: 'free',
    priceLabel: 'Бесплатно',
    purchased: true,
    isActive: true,
  },
  {
    id: 'cathedral-park',
    city: 'Рязань',
    title: 'Тайны Соборного парка',
    description: 'Лёгкий маршрут для первого знакомства с городом и игровыми механиками.',
    distanceLabel: '1.8 км',
    durationLabel: '25 минут',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
    accessType: 'free',
    priceLabel: 'Бесплатно',
    purchased: true,
  },
  {
    id: 'esenin-premium',
    city: 'Константиново',
    title: 'По следам Есенина',
    description: 'Расширенный сюжетный маршрут с премиальными точками и дополнительными наградами.',
    distanceLabel: '4.1 км',
    durationLabel: '65 минут',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80',
    accessType: 'paid',
    priceLabel: '399 ₽',
    purchased: false,
  },
  {
    id: 'art-walk-premium',
    city: 'Рязань',
    title: 'Арт-прогулка',
    description: 'Платный маршрут по современным городским точкам с дополнительными историями.',
    distanceLabel: '3.2 км',
    durationLabel: '50 минут',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    accessType: 'paid',
    priceLabel: '250 очков',
    pricePoints: 250,
    purchased: true,
  },
]

export const rewardOptions: RewardOption[] = [
  {
    id: 'coffee',
    title: 'Кофе у партнёра',
    description: 'Быстрый обмен очков на напиток в туристической точке.',
    pointsCost: 150,
  },
  {
    id: 'souvenir',
    title: 'Сувенирный стикерпак',
    description: 'Набор фирменных наклеек Trail для посетителей маршрутов.',
    pointsCost: 220,
  },
  {
    id: 'premium-discount',
    title: 'Скидка на платный маршрут',
    description: 'Списание очков вместо оплаты части стоимости премиального маршрута.',
    pointsCost: 300,
  },
]

export const initialRedemptionRequests: RedemptionRequest[] = []

export const dailyMissions: DailyMission[] = [
  {
    id: 'monuments',
    title: 'Посети 3 памятника',
    subtitle: '1/3 завершено',
    accent: 'bg-emerald-100 text-emerald-900',
    icon: '🏰',
  },
  {
    id: 'scan-park',
    title: 'Сканируй точку в парке',
    subtitle: 'Награда: +50 XP',
    accent: 'bg-amber-100 text-amber-900',
    icon: '📷',
  },
]

export const suggestedRoutes: SuggestedRoute[] = [
  {
    id: 'cathedral-park',
    title: 'Тайны Соборного парка',
    distanceLabel: '450 м от тебя',
    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'esenin',
    title: 'По следам Есенина',
    distanceLabel: '1.2 км от тебя',
    image: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'art-walk',
    title: 'Арт-прогулка',
    distanceLabel: '2.5 км от тебя',
    image: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
  },
]

export const landmarks: Landmark[] = [
  {
    id: 'furazhira-gate',
    title: 'Ворота Фуражира',
    subtitle: 'Исторический въезд в хозяйственную часть',
    image: 'https://images.unsplash.com/photo-1514894786521-26d28d4d32c2?auto=format&fit=crop&w=800&q=80',
    state: 'visited',
  },
  {
    id: 'cathedral-complex',
    title: 'Соборный ансамбль',
    subtitle: 'Центральная площадь и ключевая точка маршрута',
    image: 'https://images.unsplash.com/photo-1575908539614-ff89490f4a78?auto=format&fit=crop&w=800&q=80',
    state: 'active',
  },
  {
    id: 'secret-arch',
    title: 'Арка Мухомора',
    subtitle: 'Секретная локация за крепостной стеной',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    state: 'locked',
  },
]

export const profileStats: ProfileStat[] = [
  { id: 'visited', label: 'Локаций\nпосещено', value: '24', icon: 'castle' },
  { id: 'walked', label: 'Километров\nпройдено', value: '86.4', icon: 'directions_walk' },
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
    emoji: '🧭',
  },
  {
    id: 1,
    title: 'Исследователь',
    description: 'Уже уверенно держит темп по маршруту.',
    accent: 'from-emerald-200 to-lime-100',
    ring: 'border-emerald-300',
    emoji: '🧭',
  },
  {
    id: 2,
    title: 'Проводник',
    description: 'Открывает редкие точки и удерживает серию.',
    accent: 'from-emerald-400 to-teal-200',
    ring: 'border-emerald-500',
    emoji: '🍄',
  },
  {
    id: 3,
    title: 'Мастер маршрутов',
    description: 'Финальная эволюция MVP-профиля.',
    accent: 'from-amber-300 to-orange-200',
    ring: 'border-amber-400',
    emoji: '👑',
  },
] as const
