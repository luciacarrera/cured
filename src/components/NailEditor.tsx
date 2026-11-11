import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { fingerInfo, NAIL_SIZES } from '../data/fingers'
import { useDesign } from '../store/designStore'
import type { NailBase } from '../three/loadNail'
import { centerHit, viewRegistry, type ViewMode } from '../three/viewRegistry'
import type { CharmType, FingerId } from '../types'
import { CharmControls } from './CharmControls'
import { CHARM_MIME, CharmPalette } from './CharmPalette'
import { ConfirmDialog } from './ConfirmDialog'
import { NailScene } from './NailScene'

interface Props {
  finger: FingerId
  nail: NailBase
}

export function NailEditor({ finger, nail }: Props) {
  const info = fingerInfo(finger)
  const backToHands = useDesign((s) => s.backToHands)
  const size = useDesign((s) => s.sizes[finger])
  const setSize = useDesign((s) => s.setSize)
  const addCharm = useDesign((s) => s.addCharm)
  const clearFinger = useDesign((s) => s.clearFinger)
  const count = useDesign((s) => s.designs[finger].length)
  const [hint, setHint] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const flash = (msg: string) => {
    setHint(msg)
    window.setTimeout(() => setHint(null), 1800)
  }

  const tapAdd = (type: CharmType) => {
    const hit = centerHit.fn?.()
    if (hit) addCharm(finger, type, hit.position, hit.normal)
  }

  const pane = (mode: ViewMode, title: string) => (
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
    </section>
  )

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 px-4 pt-4 sm:px-6">
        <button
          type="button"
          onClick={backToHands}
          className="rounded-full border border-blush-200 bg-white px-4 py-2 text-sm text-cocoa-600 shadow-sm transition hover:border-rose-300"
        >
          ← Back to hands
        </button>
        <h2 className="font-display text-3xl capitalize text-cocoa-700">{info.label}</h2>
        <div className="ml-auto flex items-center gap-3 text-sm text-cocoa-600">
          <label className="flex items-center gap-2">
            Tip size
            <select
              value={size}
              onChange={(e) => setSize(finger, Number(e.target.value))}
              className="rounded-full border border-blush-200 bg-white px-3 py-1.5"
            >
              {NAIL_SIZES.map((s, i) => (
                <option key={i} value={i}>
                  {i} · {s.width}×{s.length} mm
                </option>
              ))}
            </select>
          </label>
          {count > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="rounded-full px-3 py-1.5 text-rose-500 transition hover:bg-rose-50"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:px-6">
        {pane('perspective', 'Perspective')}
        {pane('top', 'Top view')}
        {hint && (
          <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 rounded-full bg-cocoa-700/85 px-4 py-2 text-sm text-white">
            {hint}
          </div>
        )}
      </main>

      <footer className="border-t border-blush-200 bg-white/60 backdrop-blur">
        <div className="px-4 pt-3">
          <CharmControls finger={finger} />
        </div>
        <CharmPalette onTapAdd={tapAdd} />
      </footer>

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
