import type { Checkpoint } from '../../../shared/types/game'

const CHECKPOINT_URI_PREFIX = 'trail://checkpoint/'

const normalizeValue = (value: string) => value.trim().toLowerCase()

export const getQrCodeValue = (checkpointId: string) => `${CHECKPOINT_URI_PREFIX}${checkpointId}`

export const matchesCheckpointQr = (value: string, checkpointId: string) => {
  const normalizedValue = normalizeValue(value)
  const normalizedCheckpointId = normalizeValue(checkpointId)

  return (
    normalizedValue === normalizedCheckpointId ||
    normalizedValue === normalizeValue(getQrCodeValue(checkpointId))
  )
}

export const getCurrentCheckpoint = (checkpoints: Checkpoint[]) =>
  checkpoints.find((checkpoint) => checkpoint.status === 'available') ?? null
