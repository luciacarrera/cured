import { FINGERS } from '../data/fingers'
import type { FingerId, FingerName, Hand } from '../types'

/**
 * Tiny two-hand glyph (backs of the hands, fingers up) with the active finger
 * filled in. Same layout as the home screen: left hand on the left with its
 * thumb toward the centre, right hand mirrored.
 */

interface MiniFinger {
  name: FingerName
  x: number
  y: number
  angle: number
  length: number
  width: number
}

// Left hand, hand-local coordinates (palm centred near 0,0).
const LEFT: MiniFinger[] = [
  { name: 'pinky', x: -8.5, y: -6, angle: -14, length: 9, width: 4 },
  { name: 'ring', x: -3.8, y: -8, angle: -5, length: 11.5, width: 4.3 },
  { name: 'middle', x: 1, y: -8.5, angle: 1, length: 12.5, width: 4.4 },
  { name: 'index', x: 5.8, y: -7.5, angle: 8, length: 11, width: 4.3 },
  { name: 'thumb', x: 8.5, y: 1, angle: 45, length: 9, width: 4.6 },
]

const PALM = 'M -9 12 C -10 4 -11 -3 -10.5 -8 C -6 -10 6 -10 9.5 -7.5 C 10 -2 10 4 8 12 Z'

interface Props {
  active: FingerId
  className?: string
  /** Hide from assistive tech when a surrounding control already names it. */
  decorative?: boolean
}

export function HandsMiniIcon({ active, className, decorative }: Props) {
  const label = FINGERS.find((f) => f.id === active)?.label ?? ''

  const hand = (h: Hand) => {
    const prefix = h === 'left' ? 'L' : 'R'
    const transform = h === 'left' ? 'translate(-15 0)' : 'translate(15 0) scale(-1 1)'
    return (
      <g transform={transform}>
        <path d={PALM} className="fill-blush-100 stroke-cocoa-400" strokeWidth={0.9} />
        {LEFT.map((f) => {
          const on = `${prefix}-${f.name}` === active
          return (
            <rect
              key={f.name}
              x={-f.width / 2}
              y={-f.length}
              width={f.width}
              height={f.length + 2}
              rx={f.width / 2}
              transform={`translate(${f.x} ${f.y}) rotate(${f.angle})`}
              className={on ? 'fill-rose-400 stroke-rose-500' : 'fill-blush-100 stroke-cocoa-400'}
              strokeWidth={0.9}
            />
          )
        })}
      </g>
    )
  }

  return (
    <svg
      viewBox="-30 -22 60 36"
      className={className}
      {...(decorative
        ? { 'aria-hidden': true, focusable: false }
        : { role: 'img', 'aria-label': label })}
    >
      {hand('left')}
      {hand('right')}
    </svg>
  )
}
