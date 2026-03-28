import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { getRedemptionDraftSummary } from '../../features/redemption/lib/getRedemptionDraftSummary'
import { useRedemptionStore } from '../../features/redemption/model/useRedemptionStore'
import { RedemptionConfirmationCard } from '../../features/redemption/ui/RedemptionConfirmationCard'

export function RedeemConfirmPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const prizeCatalog = useRedemptionStore((state) => state.prizeCatalog)
  const user = useAuthStore((state) => state.user)
  const draftItems = useRedemptionStore((state) => state.redemptionDraftItems)
  const createRedemptionRequest = useRedemptionStore((state) => state.createRedemptionRequest)
  const activeRequest = useRedemptionStore((state) => state.getActiveRedemptionForCurrentUser())

  const summary = useMemo(
    () => getRedemptionDraftSummary(prizeCatalog, draftItems, user.rewardPointsBalance),
    [draftItems, prizeCatalog, user.rewardPointsBalance],
  )

  if (activeRequest) {
    return <Navigate to={`/redeem/${activeRequest.id}`} replace />
  }

  if (summary.items.length === 0) {
    return <Navigate to="/redeem" replace />
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await createRedemptionRequest({ items: draftItems })

    setIsSubmitting(false)

    if (!result.success || !result.request) {
      setError(result.error ?? 'Не удалось создать заявку.')
      return
    }

    navigate(`/redeem/${result.request.id}`, { replace: true })
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 pb-32">
      <RedemptionConfirmationCard
        items={summary.items}
        totalPoints={summary.totalPoints}
        balanceAfter={summary.balanceAfter}
        isSubmitting={isSubmitting}
        error={error}
        onConfirm={() => void handleConfirm()}
        onBack={() => navigate('/redeem')}
      />
    </main>
  )
}
