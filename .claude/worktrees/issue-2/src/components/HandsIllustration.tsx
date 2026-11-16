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

const CREASE = '#c99a86'

/**
 * Middle (proximal inter-phalangeal) joint on the back of the finger: a soft
 * shadow with a few uneven wrinkle lines, rather than one hard stroke.
 */
function PipFold({ w, y }: { w: number; y: number }) {
  const line = (x0: number, x1: number, dy: number, bow: number, opacity: number, width: number) => (
    <path
      d={`M ${w * x0} ${y + dy} Q ${(w * (x0 + x1)) / 2} ${y + dy + bow} ${w * x1} ${y + dy}`}
      stroke={CREASE}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
    />
  )
  return (
    <g>
      <ellipse cx={0} cy={y + 1} rx={w * 0.36} ry={7} fill="url(#joint-shade)" />
      {line(-0.15, 0.13, -3.6, -1.2, 0.28, 0.9)}
      {line(-0.27, 0.25, 0, 2.6, 0.42, 1.1)}
      {line(-0.19, 0.17, 3.4, 2, 0.28, 0.9)}
    </g>
  )
}

/** Knuckle at the base of the finger: a raised highlight with a faint shadow below it. */
function Knuckle({ w }: { w: number }) {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={w * 0.42} ry={w * 0.28} fill="url(#knuckle-light)" />
      <path
        d={`M ${-w * 0.3} ${w * 0.26} Q 0 ${w * 0.26 + 5} ${w * 0.3} ${w * 0.26}`}
        stroke={CREASE}
        strokeOpacity={0.22}
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  )
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
  const y0 = -L + L * 0.18
  const y1 = -L - L * 0.48
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
  /** Lines of text drawn between the hands (hidden on small screens, where it would be tiny). */
  hint?: string[]
}

// Between the index-finger tips, where the gap is widest.
const HINT_Y = -282
const HINT_LINE_HEIGHT = 25

export function HandsIllustration({ designs, nail, onSelect, hint }: Props) {
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
              {f.name === 'thumb' ? (
                // The thumb has only two bones, so one fold between knuckle and nail.
                <PipFold w={f.width} y={-f.length * 0.55} />
              ) : (
                <>
                  {/* top joint, just below the nail */}
                  <path
                    d={`M ${-f.width * 0.21} ${-f.length * 0.68} q ${f.width * 0.21} 2.5 ${f.width * 0.42} 0`}
                    stroke={CREASE}
                    strokeOpacity={0.45}
                    strokeWidth={1.2}
                    fill="none"
                  />
                  <PipFold w={f.width} y={-f.length * 0.42} />
                </>
              )}
              <Knuckle w={f.width} />
              <path
                d={nailS.path}
                fill="url(#nail)"
                stroke={active ? '#d9507a' : '#e7b9b0'}
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
    <svg viewBox="-470 -400 940 380" className="h-full w-full" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="nail" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f7d9d4" />
          <stop offset="1" stopColor="#fdf1ee" />
        </linearGradient>
        <radialGradient id="joint-shade">
          <stop offset="0" stopColor="#d9a28d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#d9a28d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="knuckle-light" cy="0.4">
          <stop offset="0" stopColor="#f5d3c3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f5d3c3" stopOpacity="0" />
        </radialGradient>
        <filter id="hand-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#a0685a" floodOpacity="0.18" />
        </filter>
      </defs>
      {renderHand('left')}
      {renderHand('right')}
      {hint && (
        <text
          textAnchor="middle"
          fontSize={22}
          className="pointer-events-none fill-cocoa-500 font-display italic max-sm:hidden"
        >
          {hint.map((line, i) => (
            <tspan key={i} x={0} y={HINT_Y + i * HINT_LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </svg>
  )
}
