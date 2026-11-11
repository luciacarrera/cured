import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { fingerInfo } from '../data/fingers'
import { useDesign } from '../store/designStore'
import type { NailBase } from '../three/loadNail'
import { centerHit, viewRegistry, type ViewMode } from '../three/viewRegistry'
import type { CharmType, FingerId } from '../types'
import { CharmControls } from './CharmControls'
import { CHARM_MIME, CharmPalette } from './CharmPalette'
import { HandsMiniIcon } from './HandsMiniIcon'
import { NailScene } from './NailScene'

const PANEL_KEY = 'cured-charm-panel-open'
const PANEL_ID = 'charms-panel'
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600'

/** Open by default on wide screens, collapsed on phones; remembers the last choice. */
function initialPanelOpen() {
  try {
    const stored = localStorage.getItem(PANEL_KEY)
    if (stored !== null) return stored === '1'
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia('(min-width: 640px)').matches
}

interface Props {
  finger: FingerId
  nail: NailBase
}

export function NailEditor({ finger, nail }: Props) {
  const info = fingerInfo(finger)
  const backToHands = useDesign((s) => s.backToHands)
  const saveFinger = useDesign((s) => s.saveFinger)
  const selectedId = useDesign((s) => s.selectedCharmId)
  const addCharm = useDesign((s) => s.addCharm)
  const clearFinger = useDesign((s) => s.clearFinger)
  const count = useDesign((s) => s.designs[finger].length)
  const [hint, setHint] = useState<string | null>(null)
  const [panelOpen, setPanelOpenState] = useState(initialPanelOpen)

  // When the user opens/closes the panel, move keyboard focus with it so it isn't lost.
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const focusAfterToggle = useRef(false)
  useEffect(() => {
    if (!focusAfterToggle.current) return
    focusAfterToggle.current = false
    ;(panelOpen ? closeButtonRef : openButtonRef).current?.focus()
  }, [panelOpen])

  const setPanelOpen = (open: boolean) => {
    focusAfterToggle.current = true
    setPanelOpenState(open)
    try {
      localStorage.setItem(PANEL_KEY, open ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }

  // Selecting a charm reveals its size/rotate controls.
  useEffect(() => {
    if (selectedId) setPanelOpenState(true)
  }, [selectedId])

  const flash = (msg: string) => {
    setHint(msg)
    window.setTimeout(() => setHint(null), 1800)
  }

  const tapAdd = (type: CharmType) => {
    const hit = centerHit.fn?.()
    if (hit) addCharm(finger, type, hit.position, hit.normal)
  }

  const pane = (mode: ViewMode, title: string, overlay?: ReactNode) => (
    <section
      className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-blush-200 bg-gradient-to-b from-white to-blush-50 shadow-inner"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(CHARM_MIME)) {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }
      }}
      onDrop={(e) => {
        const type = e.dataTransfer.getData(CHARM_MIME) as CharmType
        if (!type) return
        e.preventDefault()
        const hit = viewRegistry[mode]?.(e.clientX, e.clientY)
        if (hit) addCharm(finger, type, hit.position, hit.normal)
        else flash('Drop the charm right on the nail')
      }}
    >
      <span className="pointer-events-none absolute left-4 top-3 z-10 text-xs font-medium uppercase tracking-[0.2em] text-cocoa-400">
        {title}
      </span>
      <Canvas
        dpr={[1, 2]}
        onPointerMissed={() => useDesign.getState().selectCharm(null)}
        gl={{ antialias: true }}
      >
        <NailScene finger={finger} nail={nail} mode={mode} />
      </Canvas>
      {overlay}
    </section>
  )

  const charmsPanel = panelOpen ? (
    <section
      id={PANEL_ID}
      aria-labelledby="charms-heading"
      onKeyDown={(e) => {
        // Escape closes the panel, unless it's being used to deselect a charm.
        if (e.key === 'Escape' && !selectedId) setPanelOpen(false)
      }}
      className="absolute bottom-3 right-3 top-3 z-20 flex w-60 max-w-[calc(100%-1.5rem)] flex-col rounded-2xl border border-blush-200 bg-white/90 shadow-lg backdrop-blur"
      // Dropping onto the panel itself shouldn't place a charm on the nail hidden behind it.
      onDragOver={(e) => e.stopPropagation()}
      onDrop={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h3
          id="charms-heading"
          className="text-xs font-medium uppercase tracking-[0.2em] text-cocoa-600"
        >
          Charms
        </h3>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setPanelOpen(false)}
          aria-label="Hide charms"
          aria-expanded
          aria-controls={PANEL_ID}
          title="Hide charms"
          className={`-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-cocoa-600 transition hover:bg-blush-100 hover:text-rose-600 ${FOCUS_RING}`}
        >
          <span aria-hidden>×</span>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <CharmPalette onTapAdd={tapAdd} />
        <div className="border-t border-blush-200 pt-3">
          <CharmControls finger={finger} />
        </div>
      </div>
    </section>
  ) : (
    <button
      ref={openButtonRef}
      type="button"
      onClick={() => setPanelOpen(true)}
      aria-expanded={false}
      aria-controls={PANEL_ID}
      title="Show charms"
      className={`absolute right-3 top-3 z-20 flex min-h-11 items-center gap-2 rounded-full border border-blush-200 bg-white/90 px-4 py-2 text-sm font-medium text-cocoa-600 shadow-md backdrop-blur transition hover:border-rose-300 hover:text-rose-600 ${FOCUS_RING}`}
    >
      <span aria-hidden>✦</span>
      Charms
    </button>
  )

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={backToHands}
            title="Back to hands"
            aria-label="Back to hands"
            className={`rounded-xl p-1 transition hover:bg-white/70 motion-safe:hover:scale-105 ${FOCUS_RING}`}
          >
            <HandsMiniIcon active={finger} decorative className="h-9 w-auto" />
          </button>
          <h1 className="font-display text-3xl capitalize text-cocoa-700">{info.label}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {count > 0 && (
            <button
              type="button"
              onClick={() => clearFinger(finger)}
              className={`min-h-11 rounded-full px-3 py-2 text-rose-600 transition hover:bg-rose-50 ${FOCUS_RING}`}
            >
              Clear nail
            </button>
          )}
          <button
            type="button"
            onClick={() => saveFinger(finger)}
            className={`rounded-full bg-rose-400 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white shadow-lg shadow-rose-200 transition hover:bg-rose-500 sm:px-6 sm:py-3 sm:text-base ${FOCUS_RING}`}
          >
            Save nail
          </button>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:px-6">
        {pane('perspective', 'Perspective')}
        {pane('top', 'Top view', charmsPanel)}
        {/* Always mounted so screen readers announce the hint when it appears. */}
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute left-1/2 top-8 z-30 -translate-x-1/2"
        >
          {hint && (
            <div className="rounded-full bg-cocoa-700/90 px-4 py-2 text-sm text-white">{hint}</div>
          )}
        </div>
      </main>
    </div>
  )
}
