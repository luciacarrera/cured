import { useState } from 'react'
import { FINGERS } from '../data/fingers'
import { HAND_ART, NAIL_SPOTS, type NailSpot } from '../data/handArt'
import { charmDef } from '../three/charms'
import type { FingerId, PlacedCharm } from '../types'
import type { NailBase } from '../three/loadNail'

/**
 * Painted hands (backs of the hands, fingers up) with an invisible, focusable
 * click target over each nail. Hovered/focused nails get a blue ring, and
 * placed charms show as tiny dots on the nail.
 */

/** How far the click target reaches past the painted nail, in image pixels. */
const HIT_PAD_X = 10
const HIT_PAD_Y = 9

/**
 * Map a charm's base-nail position onto the nail ellipse, in nail-local
 * coordinates (y up the nail toward the free edge, x across it).
 */
function previewPoint(c: PlacedCharm, s: NailSpot, nail: NailBase) {
  const v = (nail.length / 2 - c.position[2]) / nail.length // 0 at cuticle, 1 at free edge
  const u = c.position[0] / (nail.width / 2) // -1..1, same direction as the editor top view
  const y = s.ry * (1 - 2 * v) * 0.85
  const halfWidthHere = s.rx * Math.sqrt(Math.max(0, 1 - (y / s.ry) ** 2))
  return { x: u * halfWidthHere * 0.7, y }
}

interface Props {
  designs: Record<FingerId, PlacedCharm[]>
  nail: NailBase | null
  onSelect: (id: FingerId) => void
  /** Lines of text drawn between the hands (hidden on small screens, where it would be tiny). */
  hint?: string[]
}

// In the gap between the index fingers.
const HINT_X = HAND_ART.width / 2
const HINT_Y = 140
const HINT_LINE_HEIGHT = 24

const PAD = 12
/**
 * How far the hands sit below the top of the drawing, in image pixels. The
 * visible area keeps the artwork's height, so this much of the forearms runs
 * off the bottom edge.
 */
const DROP = 230

export function HandsIllustration({ designs, nail, onSelect, hint }: Props) {
  const [active, setActive] = useState<FingerId | null>(null)
  const clear = (id: FingerId) => setActive((a) => (a === id ? null : a))

  return (
    <svg
      viewBox={`${-PAD} ${-PAD - DROP} ${HAND_ART.width + 2 * PAD} ${HAND_ART.height + PAD}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <filter id="hand-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#3a9ad9" floodOpacity="0.22" />
        </filter>
      </defs>
      <image
        href={HAND_ART.url}
        width={HAND_ART.width}
        height={HAND_ART.height}
        filter="url(#hand-shadow)"
        aria-hidden
      />
      {FINGERS.map(({ id, label }) => {
        const s = NAIL_SPOTS[id]
        const charms = designs[id] ?? []
        const on = active === id
        return (
          <g
            key={id}
            transform={`translate(${s.cx} ${s.cy}) rotate(${s.angle})`}
            className="cursor-pointer outline-none"
            role="button"
            tabIndex={0}
            aria-label={`Design ${label.toLowerCase()} nail`}
            onPointerEnter={() => setActive(id)}
            onPointerLeave={() => clear(id)}
            onFocus={() => setActive(id)}
            onBlur={() => clear(id)}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(id)
              }
            }}
          >
            {/* generous, invisible hit area */}
            <ellipse rx={s.rx + HIT_PAD_X} ry={s.ry + HIT_PAD_Y} fill="transparent" />
            <ellipse
              rx={s.rx + 2}
              ry={s.ry + 2}
              fill="white"
              fillOpacity={on ? 0.25 : 0}
              stroke="white"
              strokeOpacity={on ? 1 : 0}
              strokeWidth={2.5}
              style={{ transition: 'stroke-opacity 150ms, fill-opacity 150ms' }}
            />
            {nail &&
              charms.map((c) => {
                const p = previewPoint(c, s, nail)
                return (
                  <circle
                    key={c.id}
                    cx={p.x}
                    cy={p.y}
                    r={2.4 * c.scale}
                    fill={charmDef(c.type).color}
                    stroke="#8a5a4a"
                    strokeOpacity={0.4}
                    strokeWidth={0.5}
                  />
                )
              })}
          </g>
        )
      })}
      {hint && (
        <text
          textAnchor="middle"
          fontSize={20}
          className="pointer-events-none fill-navy-500 font-display max-sm:hidden"
        >
          {hint.map((line, i) => (
            <tspan key={i} x={HINT_X} y={HINT_Y + i * HINT_LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </svg>
  )
}
