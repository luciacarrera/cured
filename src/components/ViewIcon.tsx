import type { ReactNode } from 'react'
import type { ViewMode } from '../three/viewRegistry'

// Isometric cube faces (24×24 box).
const TOP = '12,3 20,7.5 12,12 4,7.5'
const LEFT = '4,7.5 12,12 12,21 4,16.5'
const RIGHT = '20,7.5 12,12 12,21 20,16.5'

// The same cube seen from below: bottom face at the bottom, side faces above it.
const BELOW_BOTTOM = '12,21 20,16.5 12,12 4,16.5'
const BELOW_LEFT = '4,16.5 12,12 12,3 4,7.5'
const BELOW_RIGHT = '20,16.5 12,12 12,3 20,7.5'

// Half-size cube for the rotate icon, with an orbit arrow around it.
const SMALL_TOP = '12,7.5 16,9.75 12,12 8,9.75'
const SMALL_LEFT = '8,9.75 12,12 12,16.5 8,14.25'
const SMALL_RIGHT = '16,9.75 12,12 12,16.5 16,14.25'

/** Cube with the face being looked at filled in; rotate is a cube you can orbit. */
export function ViewIcon({ mode, className }: { mode: ViewMode; className?: string }) {
  const svg = (children: ReactNode) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  )

  if (mode === 'rotate') {
    return svg(
      <>
        <polygon points={SMALL_TOP} fill="currentColor" fillOpacity={0.25} />
        <polygon points={SMALL_LEFT} fill="currentColor" fillOpacity={0.55} />
        <polygon points={SMALL_RIGHT} fill="currentColor" fillOpacity={0.85} />
        {/* Orbit: front half of an ellipse under the cube, curling up the right side. */}
        <path d="M1.5 12.5 A10.5 5 0 0 0 22.5 12.5 A10.5 5 0 0 0 17.25 8.17" />
        <polyline points="19.6,10.9 17.25,8.17 20.6,7" />
      </>,
    )
  }

  if (mode === 'bottom') {
    return svg(
      <>
        <polygon points={BELOW_BOTTOM} fill="currentColor" fillOpacity={0.85} />
        <polygon points={BELOW_LEFT} />
        <polygon points={BELOW_RIGHT} />
      </>,
    )
  }

  const fill = (face: ViewMode) => (mode === face ? 0.85 : 0)
  return svg(
    <>
      <polygon points={TOP} fill="currentColor" fillOpacity={fill('top')} />
      <polygon points={LEFT} fill="currentColor" fillOpacity={fill('left')} />
      <polygon points={RIGHT} fill="currentColor" fillOpacity={fill('right')} />
    </>,
  )
}
