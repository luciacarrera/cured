import { useEffect, useState } from 'react'

type StarColor = 'baby' | 'periwinkle' | 'white'

interface Star {
  /** Position as a percentage of the screen. */
  top: number
  left: number
  /** Font size in rem. */
  size: number
  glyph: '✦' | '✧'
  color: StarColor
  /** Seconds. */
  delay: number
  duration: number
}

// Fixed so the stars don't jump around between renders. They ring the title
// and leave the centre clear.
const STARS: Star[] = [
  { top: 14, left: 12, size: 1.6, glyph: '✦', color: 'baby', delay: 0, duration: 7 },
  { top: 22, left: 30, size: 1, glyph: '✧', color: 'periwinkle', delay: 1.4, duration: 9 },
  { top: 10, left: 52, size: 1.3, glyph: '✦', color: 'white', delay: 0.6, duration: 8 },
  { top: 18, left: 74, size: 1.9, glyph: '✦', color: 'periwinkle', delay: 2.1, duration: 10 },
  { top: 12, left: 90, size: 1.1, glyph: '✧', color: 'baby', delay: 0.9, duration: 7.5 },
  { top: 38, left: 6, size: 1.2, glyph: '✧', color: 'white', delay: 2.6, duration: 8.5 },
  { top: 34, left: 86, size: 1.4, glyph: '✦', color: 'baby', delay: 1.1, duration: 9.5 },
  { top: 56, left: 10, size: 1.8, glyph: '✦', color: 'periwinkle', delay: 0.3, duration: 10.5 },
  { top: 62, left: 92, size: 1.2, glyph: '✧', color: 'periwinkle', delay: 1.8, duration: 8 },
  { top: 76, left: 22, size: 1.1, glyph: '✧', color: 'baby', delay: 2.9, duration: 7 },
  { top: 84, left: 44, size: 1.5, glyph: '✦', color: 'white', delay: 0.5, duration: 9 },
  { top: 80, left: 66, size: 1, glyph: '✧', color: 'baby', delay: 2.3, duration: 8.5 },
  { top: 72, left: 82, size: 1.7, glyph: '✦', color: 'baby', delay: 1.6, duration: 10 },
  { top: 90, left: 8, size: 1.2, glyph: '✦', color: 'periwinkle', delay: 3.2, duration: 9 },
]

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Full-screen splash shown on every load. Once `leaving` turns true it fades
 * out (instantly with reduced motion) and then unmounts itself.
 */
export function LoadingScreen({ leaving }: { leaving: boolean }) {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (leaving && prefersReducedMotion()) setGone(true)
  }, [leaving])

  if (gone) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
      className={`loading-screen y2k-backdrop fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-4 ${leaving ? 'loading-fade-out' : ''}`}
      onTransitionEnd={(e) => {
        if (leaving && e.target === e.currentTarget) setGone(true)
      }}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          aria-hidden
          className="loading-star-drift pointer-events-none absolute"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            animationDelay: `-${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <span
            className={`loading-star loading-star-${s.color}`}
            style={{ fontSize: `${s.size}rem`, animationDelay: `-${s.delay * 1.3}s` }}
          >
            {s.glyph}
          </span>
        </span>
      ))}

      <div className="relative font-display text-7xl leading-none font-bold tracking-wide sm:text-9xl">
        <span className="y2k-chrome-text" data-text="Cured">
          Cured
        </span>
      </div>
      <p className="relative mt-4 max-w-xs text-center text-balance font-pixel text-2xl sm:max-w-none text-navy-500 sm:text-3xl">
        fix all your problems with a fresh set
      </p>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
