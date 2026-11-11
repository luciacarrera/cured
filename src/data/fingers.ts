import type { FingerId, FingerName, Hand } from '../types'

export interface FingerInfo {
  id: FingerId
  hand: Hand
  name: FingerName
  label: string
}

const NAMES: FingerName[] = ['thumb', 'index', 'middle', 'ring', 'pinky']

export const FINGERS: FingerInfo[] = (['left', 'right'] as Hand[]).flatMap((hand) =>
  NAMES.map((name) => ({
    id: `${hand === 'left' ? 'L' : 'R'}-${name}` as FingerId,
    hand,
    name,
    label: `${hand === 'left' ? 'Left' : 'Right'} ${name}`,
  })),
)

export const fingerInfo = (id: FingerId) => FINGERS.find((f) => f.id === id)!

/** Gel-x tip sizes 0–11: free-edge width and length in mm (from the size chart). */
export const NAIL_SIZES: { width: number; length: number }[] = [
  { width: 15, length: 32 }, { width: 14, length: 32 }, { width: 14, length: 30 },
  { width: 13, length: 30 }, { width: 12, length: 29 }, { width: 11, length: 29 },
  { width: 11, length: 28 }, { width: 11, length: 27 }, { width: 10, length: 27 },
  { width: 9, length: 27 }, { width: 8, length: 26 }, { width: 7, length: 25 },
]

export const DEFAULT_SIZE: Record<FingerName, number> = {
  thumb: 1, index: 5, middle: 3, ring: 6, pinky: 9,
}
