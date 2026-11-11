import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { fingerInfo, NAIL_SIZES } from '../data/fingers'
import { useDesign } from '../store/designStore'
import type { NailBase } from '../three/loadNail'
import { centerHit, viewRegistry, type ViewMode } from '../three/viewRegistry'
import type { CharmType, FingerId } from '../types'
import { CharmControls } from './CharmControls'
import { CHARM_MIME, CharmPalette } from './CharmPalette'
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
        const hit = viewRegistry[mode]?.(e.clientX, e.clientY)
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
          className="y2k-gloss rounded-full px-4 py-2 text-sm font-semibold"
        >
          <span className="y2k-chrome-label">← Back to hands</span>
        </button>
        <h2 className="font-display text-4xl font-bold capitalize tracking-wide">
          <span className="y2k-chrome-text" data-text={info.label}>
            {info.label}
          </span>
        </h2>
        <div className="ml-auto flex items-center gap-3 text-sm text-navy-600">
          <label className="flex items-center gap-2">
            Tip size
            <select
              value={size}
              onChange={(e) => setSize(finger, Number(e.target.value))}
              className="rounded-full border border-chrome bg-white px-3 py-1.5 text-navy-700"
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
              onClick={() => clearFinger(finger)}
              className="rounded-full px-3 py-1.5 text-rose-600 transition hover:bg-rose-50"
            >
              Clear nail
            </button>
          )}
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:px-6">
        {pane('perspective', 'Perspective')}
        {pane('top', 'Top view')}
        {hint && (
          <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 rounded-full bg-navy-700/85 px-4 py-2 text-sm text-white">
            {hint}
          </div>
        )}
      </main>

      <footer className="y2k-glass border-x-0 border-b-0">
        <div className="px-4 pt-3">
          <CharmControls finger={finger} />
        </div>
        <CharmPalette onTapAdd={tapAdd} />
      </footer>
    </div>
  )
}
