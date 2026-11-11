import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { fingerInfo } from '../data/fingers'
import { useDesign } from '../store/designStore'
import type { NailBase } from '../three/loadNail'
import { centerHit, screenHit, type FixedView, type ViewMode } from '../three/viewRegistry'
import type { CharmType, FingerId } from '../types'
import { CharmControls } from './CharmControls'
import { CHARM_MIME, CharmPalette } from './CharmPalette'
import { ConfirmDialog } from './ConfirmDialog'
import { HandsMiniIcon } from './HandsMiniIcon'
import { NailScene } from './NailScene'
import { ViewIcon } from './ViewIcon'

const PANEL_KEY = 'cured-charm-panel-open'

const VIEWS: { mode: ViewMode; title: string }[] = [
  { mode: 'top', title: 'Top view' },
  { mode: 'right', title: 'Right view' },
  { mode: 'left', title: 'Left view' },
  { mode: 'bottom', title: 'Bottom view' },
  { mode: 'rotate', title: 'Rotate freely' },
]
const PANEL_ID = 'charms-panel'

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
  const [confirmClear, setConfirmClear] = useState(false)
  const [panelOpen, setPanelOpenState] = useState(initialPanelOpen)
  const [view, setView] = useState<ViewMode>('top')
  // Free rotation starts from whichever preset angle was showing last.
  const [lastFixed, setLastFixed] = useState<FixedView>('top')
  const chooseView = (mode: ViewMode) => {
    setView(mode)
    if (mode !== 'rotate') setLastFixed(mode)
  }

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
      className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-chrome bg-gradient-to-b from-white to-baby-50 shadow-[inset_0_2px_12px_rgb(58_154_217_/_0.15)]"
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
        const hit = screenHit.fn?.(e.clientX, e.clientY)
        if (hit) addCharm(finger, type, hit.position, hit.normal)
        else flash('Drop the charm right on the nail')
      }}
    >
      <span className="pointer-events-none absolute left-4 top-3 z-10 font-pixel text-lg uppercase tracking-[0.2em] text-navy-400">
        {title}
      </span>
      <Canvas
        dpr={[1, 2]}
        onPointerMissed={() => useDesign.getState().selectCharm(null)}
        gl={{ antialias: true }}
      >
        <NailScene finger={finger} nail={nail} mode={mode} rotateFrom={lastFixed} />
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
      className="y2k-glass absolute bottom-3 right-3 top-3 z-20 flex w-60 max-w-[calc(100%-1.5rem)] flex-col rounded-2xl"
      // Dropping onto the panel itself shouldn't place a charm on the nail hidden behind it.
      onDragOver={(e) => e.stopPropagation()}
      onDrop={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h2 id="charms-heading" className="font-pixel text-lg uppercase tracking-[0.2em] text-navy-600">
          Charms
        </h2>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setPanelOpen(false)}
          aria-label="Hide charms"
          aria-expanded
          aria-controls={PANEL_ID}
          title="Hide charms"
          className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none text-navy-600 transition hover:bg-baby-100"
        >
          <span aria-hidden>×</span>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <CharmPalette onTapAdd={tapAdd} />
        <div className="border-t border-chrome pt-3">
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
      className="y2k-gloss absolute right-3 top-3 z-20 flex min-h-11 items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold"
    >
      <span aria-hidden className="text-navy-600">
        ✦
      </span>
      <span className="y2k-chrome-label">Charms</span>
    </button>
  )

  const viewButtons = (
    <div
      role="radiogroup"
      aria-label="Camera view"
      className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1"
    >
      {VIEWS.map((v) => {
        const active = v.mode === view
        return (
          <button
            key={v.mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={v.title}
            title={v.title}
            onClick={() => chooseView(v.mode)}
            className={`flex h-11 w-11 items-center justify-center rounded-full text-navy-600 transition ${
              active ? 'y2k-gloss' : 'hover:bg-white/70'
            }`}
          >
            <ViewIcon mode={v.mode} className="h-6 w-6" />
          </button>
        )
      })}
    </div>
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
            className="rounded-xl p-1 transition hover:bg-white/70 motion-safe:hover:scale-105"
          >
            <HandsMiniIcon active={finger} decorative className="h-9 w-auto" />
          </button>
          <h1 className="font-display text-4xl font-bold capitalize tracking-wide">
            <span className="y2k-chrome-text" data-text={info.label}>
              {info.label}
            </span>
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm">
          {count > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="min-h-11 rounded-full px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50 sm:px-4 sm:py-3"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={() => saveFinger(finger)}
            className="y2k-gloss rounded-full px-4 py-2.5 font-display text-sm font-semibold whitespace-nowrap sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="y2k-chrome-label">Save nail</span>
          </button>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:px-6">
        {pane(
          view,
          VIEWS.find((v) => v.mode === view)!.title,
          <>
            {viewButtons}
            {charmsPanel}
          </>,
        )}
        {/* Always mounted so screen readers announce the hint when it appears. */}
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute left-1/2 top-8 z-30 -translate-x-1/2"
        >
          {hint && (
            <div className="rounded-full bg-navy-700/90 px-4 py-2 text-sm text-white">{hint}</div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={confirmClear}
        title="Reset this nail?"
        message={`This removes ${count === 1 ? 'the 1 charm' : `all ${count} charms`} from your ${info.label.toLowerCase()} nail.`}
        confirmLabel="Reset"
        onConfirm={() => {
          clearFinger(finger)
          setConfirmClear(false)
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  )
}
