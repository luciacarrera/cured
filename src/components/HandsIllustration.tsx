import { useState } from 'react'
import { charmDef } from '../three/charms'
import type { FingerId, FingerName, Hand, PlacedCharm } from '../types'
import type { NailBase } from '../three/loadNail'

/**
 * Stylized 2D hands (backs of the hands, fingers up). Each finger and nail is a
 * click target. Drawn in hand-local coordinates for a left hand; the right hand
 * is the mirror image. Swap this component out for a 3D hand later if wanted.
 */

interface FingerGeom {
  name: FingerName
  /** Base of the finger (knuckle), hand-local. */
  x: number
  y: number
  /** Degrees, clockwise from straight up. */
  angle: number
  length: number
  width: number
}

// Left hand, back view: pinky on the outside (left), thumb toward the centre (right).
const LEFT_HAND: FingerGeom[] = [
  { name: 'pinky', x: -58, y: -150, angle: -14, length: 120, width: 29 },
  { name: 'ring', x: -22, y: -178, angle: -5, length: 152, width: 32 },
  { name: 'middle', x: 14, y: -186, angle: 1, length: 166, width: 33 },
  { name: 'index', x: 50, y: -172, angle: 8, length: 150, width: 32 },
  { name: 'thumb', x: 68, y: -60, angle: 38, length: 118, width: 36 },
]

const SKIN = '#efc6b2'

const PALM =
  'M -52 120 C -54 40 -78 -60 -76 -140 C -74 -182 -40 -200 10 -200 ' +
  'C 52 -200 74 -186 72 -150 C 70 -110 86 -70 82 -30 C 76 10 54 40 52 120 Z'

function fingerPath(w: number, L: number) {
  const t = w * 0.43
  return `M ${-w / 2} 24 L ${-t} ${-L + t} A ${t} ${t} 0 0 1 ${t} ${-L + t} L ${w / 2} 24 Z`
}

interface NailShape {
  path: string
  /** Cuticle y, free-edge y, half-widths at cuticle / free edge. */
  y0: number
  y1: number
  hw0: number
  hw1: number
}

function nailShape(w: number, L: number): NailShape {
  const t = w * 0.43
  const hw0 = t * 0.78
  const hw1 = t * 0.92
  const y0 = -L + L * 0.34
  const y1 = -L - L * 0.32
  const r = hw1 * 0.75
  const path =
    `M ${-hw0} ${y0 - 3} Q 0 ${y0 + 8} ${hw0} ${y0 - 3} ` +
    `L ${hw1} ${y1 + r} Q ${hw1} ${y1} 0 ${y1} Q ${-hw1} ${y1} ${-hw1} ${y1 + r} Z`
  return { path, y0, y1, hw0, hw1 }
}

/** Map a charm's base-nail position onto the 2D nail for a tiny preview dot. */
function previewPoint(c: PlacedCharm, n: NailShape, nail: NailBase, mirrored: boolean) {
  const v = (nail.length / 2 - c.position[2]) / nail.length // 0 at cuticle, 1 at free edge
  // The right hand is drawn mirrored, so un-mirror x to match the editor top view.
  const u = ((mirrored ? -1 : 1) * c.position[0]) / (nail.width / 2) // -1..1
  const hw = n.hw0 + (n.hw1 - n.hw0) * v
  return { x: u * hw, y: n.y0 + (n.y1 - n.y0) * v }
}

interface Props {
  designs: Record<FingerId, PlacedCharm[]>
  nail: NailBase | null
  onSelect: (id: FingerId) => void
}

export function HandsIllustration({ designs, nail, onSelect }: Props) {
  const [hover, setHover] = useState<FingerId | null>(null)

  const renderHand = (hand: Hand) => {
    const prefix = hand === 'left' ? 'L' : 'R'
    const transform =
      hand === 'left' ? 'translate(-215 40) rotate(7)' : 'translate(215 40) scale(-1 1) rotate(7)'
    return (
      <g transform={transform} filter="url(#hand-shadow)">
        <path d={PALM} fill={SKIN} />
        {LEFT_HAND.map((f) => {
          const id = `${prefix}-${f.name}` as FingerId
          const nailS = nailShape(f.width, f.length)
          const charms = designs[id] ?? []
          const active = hover === id
          return (
            <g
              key={id}
              transform={`translate(${f.x} ${f.y}) rotate(${f.angle})`}
              className="cursor-pointer"
              onPointerEnter={() => setHover(id)}
              onPointerLeave={() => setHover((h) => (h === id ? null : h))}
              onClick={() => onSelect(id)}
              role="button"
              aria-label={`Design ${hand} ${f.name} nail`}
            >
              <path d={fingerPath(f.width, f.length)} fill={SKIN} />
              {/* knuckle creases */}
              <path
                d={`M ${-f.width * 0.25} ${-f.length * 0.42} q ${f.width * 0.25} 3 ${f.width * 0.5} 0`}
                stroke="#c99a86"
                strokeOpacity={0.45}
                strokeWidth={1.2}
                fill="none"
              />
              <path
                d={`M ${-f.width * 0.22} ${-f.length * 0.1} q ${f.width * 0.22} 3 ${f.width * 0.44} 0`}
                stroke="#c99a86"
                strokeOpacity={0.35}
                strokeWidth={1.2}
                fill="none"
              />
              <path
                d={nailS.path}
                fill="url(#nail)"
                stroke={active ? '#3a9ad9' : '#e7b9b0'}
                strokeWidth={active ? 2.2 : 1}
                style={{ transition: 'stroke 150ms, stroke-width 150ms' }}
              />
              {/* gloss highlight */}
              <path
                d={`M ${-nailS.hw0 * 0.45} ${nailS.y0 - 8} L ${-nailS.hw1 * 0.5} ${nailS.y1 + 14}`}
                stroke="white"
                strokeOpacity={0.55}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              {nail &&
                charms.map((c) => {
                  const p = previewPoint(c, nailS, nail, hand === 'right')
                  return (
                    <circle
                      key={c.id}
                      cx={p.x}
                      cy={p.y}
                      r={3.4 * c.scale}
                      fill={charmDef(c.type).color}
                      stroke="#8a5a4a"
                      strokeOpacity={0.4}
                      strokeWidth={0.6}
                    />
                  )
                })}
            </g>
          )
        })}
      </g>
    )
  }

  return (
    <svg viewBox="-470 -400 940 440" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="nail" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f7d9d4" />
          <stop offset="1" stopColor="#fdf1ee" />
        </linearGradient>
        <filter id="hand-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#3a9ad9" floodOpacity="0.22" />
        </filter>
      </defs>
      {renderHand('left')}
      {renderHand('right')}
    </svg>
  )
}
