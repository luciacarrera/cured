import { useState } from 'react'
import { useDesign } from '../store/designStore'
import { exportStl, stlFileName } from '../three/exportStl'
import type { NailBase } from '../three/loadNail'
import { ConfirmDialog } from './ConfirmDialog'
import { HandsIllustration } from './HandsIllustration'

export function HandsScreen({ nail }: { nail: NailBase | null }) {
  const designs = useDesign((s) => s.designs)
  const sizes = useDesign((s) => s.sizes)
  const openFinger = useDesign((s) => s.openFinger)
  const clearAll = useDesign((s) => s.clearAll)
  const backToSets = useDesign((s) => s.backToSets)
  const setName = useDesign((s) => (s.activeSetId ? s.sets[s.activeSetId]?.name : undefined) ?? 'Untitled set')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const decorated = Object.values(designs).filter((d) => d.length > 0).length
  const totalCharms = Object.values(designs).reduce((n, d) => n + d.length, 0)

  const onExport = async () => {
    setBusy(true)
    setError(null)
    try {
      await exportStl(designs, sizes, stlFileName(setName))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <button
            type="button"
            onClick={backToSets}
            className="-ml-2 mb-1 rounded-full px-2 py-1 font-pixel text-xl leading-none text-navy-500 transition hover:bg-white/70"
          >
            ‹ Your sets
          </button>
          <h1 className="flex min-w-0 items-center gap-2 font-display text-2xl leading-tight font-bold tracking-wide sm:text-5xl sm:leading-none">
            <span className="y2k-chrome-text" data-text={setName}>
              {setName}
            </span>
            <span className="sparkle text-xl" aria-hidden>
              ✦
            </span>
          </h1>
          <p className="mt-1.5 font-pixel text-xl text-navy-500 tabular-nums">{decorated}/10 nails done</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {totalCharms > 0 && (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="rounded-full px-3 py-2.5 text-sm text-navy-500 transition hover:bg-white/70 sm:px-4 sm:py-3"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onExport}
              disabled={busy || !nail}
              className="y2k-gloss rounded-full px-4 py-2.5 font-display text-sm font-semibold whitespace-nowrap disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
            >
              <span className="y2k-chrome-label">{busy ? 'Preparing…' : 'Download set'}</span>
            </button>
          </div>
          {error && <p className="max-w-xs text-right text-sm text-rose-600">{error}</p>}
        </div>
      </header>

      {/* On phones the in-drawing hint would be too small, so show it as text instead. */}
      <p className="mt-6 text-center font-pixel text-xl text-navy-500 sm:hidden">Tap a nail to design</p>

      <div className="min-h-[320px] w-full flex-1">
        <HandsIllustration designs={designs} nail={nail} onSelect={openFinger} hint={['Tap a nail', 'to design']} />
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all nails?"
        message={`This removes ${totalCharms === 1 ? 'the 1 charm' : `all ${totalCharms} charms`} from all ten nails.`}
        confirmLabel="Reset"
        onConfirm={() => {
          clearAll()
          setConfirmReset(false)
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
