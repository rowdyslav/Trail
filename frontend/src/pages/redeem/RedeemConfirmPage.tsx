import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/useAuthStore'
import { getCodeDraftSummary } from '../../features/code/lib/getCodeDraftSummary'
import { useCodeStore } from '../../features/code/model/useCodeStore'
import { CodeConfirmationCard } from '../../features/code/ui/CodeConfirmationCard'

export function RedeemConfirmPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const prizeCatalog = useCodeStore((state) => state.prizeCatalog)
  const user = useAuthStore((state) => state.user)
  const draftItems = useCodeStore((state) => state.codeDraftItems)
  const createCodeRequest = useCodeStore((state) => state.createCodeRequest)
  const activeCode = useCodeStore((state) => state.getActiveCodeForCurrentUser())

  const summary = useMemo(
    () => getCodeDraftSummary(prizeCatalog, draftItems, user.rewardPointsBalance),
    [draftItems, prizeCatalog, user.rewardPointsBalance],
  )

  if (activeCode) {
    return <Navigate to={`/redeem/${activeCode.id}`} replace />
  }

  if (summary.items.length === 0) {
    return <Navigate to="/redeem" replace />
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)

    const result = await createCodeRequest({ items: draftItems })

    setIsSubmitting(false)

    if (!result.success || !result.request) {
      setError(result.error ?? 'Не удалось создать заявку.')
      return
    }

    navigate(`/redeem/${result.request.id}`, { replace: true })
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 pb-32">
      <CodeConfirmationCard
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
