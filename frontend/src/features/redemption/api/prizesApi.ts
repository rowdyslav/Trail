import { apiRequest } from '../../../shared/api/http'
import type { PrizeCatalogItem } from '../../../shared/types/game'

interface PrizeRead {
  id: string
  title: string
  description: string
  points_cost: number
  is_active: boolean
}

const mapPrize = (prize: PrizeRead): PrizeCatalogItem => ({
  id: prize.id,
  title: prize.title,
  description: prize.description,
  pointsCost: prize.points_cost,
  isActive: prize.is_active,
})

export const prizesApi = {
  list: async (token: string) => {
    const prizes = await apiRequest<PrizeRead[]>('/prizes', {
      method: 'GET',
      token,
    })

    return prizes.map(mapPrize)
  },
}
