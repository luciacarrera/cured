import { FINGERS } from '../data/fingers'
import { HAND_ART, NAIL_SPOTS } from '../data/handArt'
import { charmDef } from '../three/charms'
import type { NailBase } from '../three/loadNail'
import type { NailSet } from '../types'
import { previewPoint } from './HandsIllustration'

/**
 * The painted hands cropped to the fingertips, with a set's charms drawn on
 * the nails. Charm dots are drawn larger than on the home screen so they still
 * read at card size.
 */
export function SetThumbnail({ set, nail }: { set: NailSet; nail: NailBase | null }) {
  return (
    <svg
      viewBox={`-20 -20 ${HAND_ART.width + 40} ${((HAND_ART.width + 40) * 9) / 16}`}
      preserveAspectRatio="xMidYMin slice"
      className="h-full w-full"
      aria-hidden
      focusable={false}
    >
      <image href={HAND_ART.url} width={HAND_ART.width} height={HAND_ART.height} />
      {FINGERS.map(({ id }) => {
        const s = NAIL_SPOTS[id]
        const charms = set.designs[id] ?? []
        return (
          <g key={id} transform={`translate(${s.cx} ${s.cy}) rotate(${s.angle})`}>
            {charms.length > 0 && (
              <ellipse
                rx={s.rx + 3}
                ry={s.ry + 3}
                fill="white"
                fillOpacity={0.35}
                stroke="white"
                strokeWidth={3}
              />
            )}
            {nail &&
              charms.map((c) => {
                const p = previewPoint(c, s, nail)
                return (
                  <circle
                    key={c.id}
                    cx={p.x}
                    cy={p.y}
                    r={8 * c.scale}
                    fill={charmDef(c.type).color}
                    stroke="#8a5a4a"
                    strokeOpacity={0.5}
                    strokeWidth={1.2}
                  />
                )
              })}
          </g>
        )
      })}
    </svg>
  )
}
