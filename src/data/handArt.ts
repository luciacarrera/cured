import type { FingerId } from '../types'

/**
 * The painted hands illustration (backs of both hands, fingers up, thumbs toward
 * the centre) and where each nail sits on it. Coordinates are image pixels.
 */
export const HAND_ART = {
  url: '/illustrations/hands.webp',
  width: 973,
  height: 642,
}

export interface NailSpot {
  /** Centre of the nail. */
  cx: number
  cy: number
  /** Half-width across the nail and half-length along it. */
  rx: number
  ry: number
  /** Degrees, clockwise from straight up (the free edge points this way). */
  angle: number
}

// Measured from the artwork. Image left is the left hand, so the left pinky is leftmost.
export const NAIL_SPOTS: Record<FingerId, NailSpot> = {
  'L-pinky': { cx: 19, cy: 169, rx: 9, ry: 19, angle: -28 },
  'L-ring': { cx: 95, cy: 72, rx: 12, ry: 22, angle: -11 },
  'L-middle': { cx: 174, cy: 28, rx: 13, ry: 23, angle: -6 },
  'L-index': { cx: 280, cy: 55, rx: 12, ry: 22, angle: 7 },
  'L-thumb': { cx: 426, cy: 269, rx: 13, ry: 25, angle: 49 },
  'R-thumb': { cx: 540, cy: 270, rx: 13, ry: 25, angle: -48 },
  'R-index': { cx: 688, cy: 58, rx: 12, ry: 22, angle: -5 },
  'R-middle': { cx: 795, cy: 32, rx: 13, ry: 23, angle: 7 },
  'R-ring': { cx: 873, cy: 80, rx: 12, ry: 22, angle: 13 },
  'R-pinky': { cx: 953, cy: 180, rx: 9, ry: 18, angle: 29 },
}
