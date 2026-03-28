import type { ProfileStat, UpgradeItem } from '../../../shared/types/game'

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
