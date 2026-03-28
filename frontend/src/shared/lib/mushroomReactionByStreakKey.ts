import type { StreakKey } from '../types/game'

const reactionsByStreakKey: Record<StreakKey, string> = {
  novice: 'Я снова юный гриб. Зато путь только начинается.',
  explorer: 'О, уже интереснее. Похоже, я стал грибом-исследователем.',
  traveler: 'Смотри-ка, я подрос. Теперь я настоящий гриб-путешественник.',
  pathfinder: 'Вот это рост. Похоже, я уже уверенно веду по маршруту.',
  legend: 'Ничего себе. Кажется, я дорос до легендарного гриба.',
}

export function getMushroomReactionByStreakKey(streakKey: StreakKey) {
  return reactionsByStreakKey[streakKey]
}
