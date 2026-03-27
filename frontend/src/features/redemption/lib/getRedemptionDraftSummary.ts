import type { PrizeCatalogItem, RedemptionDraftItem, RedemptionRequestItem } from '../../../shared/types/game'

export interface RedemptionDraftSummary {
  items: RedemptionRequestItem[]
  totalPoints: number
  totalQuantity: number
  balanceAfter: number
}

export function getRedemptionDraftSummary(
  prizeCatalog: PrizeCatalogItem[],
  draftItems: RedemptionDraftItem[],
  rewardPointsBalance: number,
): RedemptionDraftSummary {
  const items = draftItems
    .map((draftItem) => {
      const prize = prizeCatalog.find((item) => item.id === draftItem.prizeId && item.isActive !== false)

      if (!prize || draftItem.quantity <= 0) {
        return null
      }

      return {
        prizeId: prize.id,
        titleSnapshot: prize.title,
        pointsCostSnapshot: prize.pointsCost,
        quantity: draftItem.quantity,
        totalPoints: prize.pointsCost * draftItem.quantity,
      } satisfies RedemptionRequestItem
    })
    .filter((item): item is RedemptionRequestItem => item !== null)

  const totalPoints = items.reduce((sum, item) => sum + item.totalPoints, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    items,
    totalPoints,
    totalQuantity,
    balanceAfter: rewardPointsBalance - totalPoints,
  }
}
