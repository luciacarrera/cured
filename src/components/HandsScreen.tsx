import { useState } from 'react'
import { useDesign } from '../store/designStore'
import { exportStl } from '../three/exportStl'
import type { NailBase } from '../three/loadNail'
import { HandsIllustration } from './HandsIllustration'

export function HandsScreen({ nail }: { nail: NailBase | null }) {
  const designs = useDesign((s) => s.designs)
  const sizes = useDesign((s) => s.sizes)
  const openFinger = useDesign((s) => s.openFinger)
  const clearAll = useDesign((s) => s.clearAll)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const decorated = Object.values(designs).filter((d) => d.length > 0).length
  const totalCharms = Object.values(designs).reduce((n, d) => n + d.length, 0)

  const onExport = async () => {
    setBusy(true)
    setError(null)
    try {
      await exportStl(designs, sizes)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-col items-center gap-2 px-6 pt-10 text-center">
        <h1 className="flex items-center gap-3 font-display text-7xl font-bold tracking-tight">
          <span className="sparkle text-3xl" aria-hidden>✦</span>
          <span className="y2k-chrome-text" data-text="cured">cured</span>
          <span className="sparkle text-2xl" aria-hidden>✧</span>
        </h1>
        <p className="max-w-md text-navy-500">
          Tap a nail to decorate it. When every nail is done, export one print-ready STL.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onExport}
            disabled={busy || !nail}
            className="y2k-gloss rounded-full px-6 py-3 font-display font-semibold disabled:opacity-50"
          >
            <span className="y2k-chrome-label">{busy ? 'Building STL…' : 'Finish & export STL'}</span>
          </button>
          {totalCharms > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Remove every charm from all ten nails?')) clearAll()
              }}
              className="rounded-full px-4 py-3 text-sm text-navy-500 transition hover:bg-white/70"
            >
              Start over
            </button>
          )}
        </div>
        <p className="font-pixel text-xl tracking-wide text-navy-400">
          {decorated} of 10 nails decorated · {totalCharms} charm{totalCharms === 1 ? '' : 's'}
        </p>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </header>

      <div className="mt-auto h-[62vh] min-h-[320px] w-full">
        <HandsIllustration designs={designs} nail={nail} onSelect={openFinger} />
      </div>
    </div>
  )
}
