import { useState } from 'react'
import { useDesign } from '../store/designStore'
import { exportStl } from '../three/exportStl'
import type { NailBase } from '../three/loadNail'
import { ConfirmDialog } from './ConfirmDialog'
import { HandsIllustration } from './HandsIllustration'

export function HandsScreen({ nail }: { nail: NailBase | null }) {
  const designs = useDesign((s) => s.designs)
  const sizes = useDesign((s) => s.sizes)
  const openFinger = useDesign((s) => s.openFinger)
  const clearAll = useDesign((s) => s.clearAll)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

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
      <header className="flex items-start justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h1 className="font-display text-4xl leading-none font-medium italic tracking-tight text-cocoa-700 sm:text-5xl">
            Cured
          </h1>
          <p className="mt-1.5 text-lg text-cocoa-500 tabular-nums">{decorated}/10 nails done</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            {totalCharms > 0 && (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="rounded-full px-3 py-2.5 text-sm text-cocoa-500 transition hover:bg-white/70 sm:px-4 sm:py-3"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onExport}
              disabled={busy || !nail}
              className="rounded-full bg-rose-400 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white shadow-lg shadow-rose-200 transition hover:bg-rose-500 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
            >
              {busy ? 'Preparing…' : 'Download set'}
            </button>
          </div>
          {error && <p className="max-w-xs text-right text-sm text-rose-600">{error}</p>}
        </div>
      </header>

      {/* On phones the in-drawing hint would be too small, so show it as text instead. */}
      <p className="mt-6 text-center font-display text-xl italic text-cocoa-500 sm:hidden">
        Tap a nail to design
      </p>

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
