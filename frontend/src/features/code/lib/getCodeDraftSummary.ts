import type { PrizeCatalogItem, CodeDraftItem, CodeRequestItem } from '../../../shared/types/game'

export interface CodeDraftSummary {
  items: CodeRequestItem[]
  totalPoints: number
  totalQuantity: number
  balanceAfter: number
}

export function getCodeDraftSummary(
  prizeCatalog: PrizeCatalogItem[],
  draftItems: CodeDraftItem[],
  rewardPointsBalance: number,
): CodeDraftSummary {
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
      } satisfies CodeRequestItem
    })
    .filter((item): item is CodeRequestItem => item !== null)

  const totalPoints = items.reduce((sum, item) => sum + item.totalPoints, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    items,
    totalPoints,
    totalQuantity,
    balanceAfter: rewardPointsBalance - totalPoints,
  }
}
