import { useEffect } from 'react'
import { useDesign } from '../store/designStore'
import { charmDef } from '../three/charms'
import type { FingerId } from '../types'
import { CharmIcon } from './CharmIcon'

export function CharmControls({ finger }: { finger: FingerId }) {
  const selectedId = useDesign((s) => s.selectedCharmId)
  const charm = useDesign((s) => s.designs[finger].find((c) => c.id === selectedId))
  const updateCharm = useDesign((s) => s.updateCharm)
  const removeCharm = useDesign((s) => s.removeCharm)
  const selectCharm = useDesign((s) => s.selectCharm)

  useEffect(() => {
    if (!charm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'Delete' || e.key === 'Backspace') removeCharm(finger, charm.id)
      if (e.key === 'Escape') selectCharm(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [charm, finger, removeCharm, selectCharm])

  if (!charm) {
    return (
      <p className="text-sm text-cocoa-500">
        Drag a charm onto the nail in either view. Click a placed charm to select it, drag it to
        move.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-sm text-cocoa-600">
      <span className="flex items-center gap-2 font-medium">
        <CharmIcon type={charm.type} className="h-6 w-6" />
        {charmDef(charm.type).label}
      </span>
      <label className="flex items-center justify-between gap-2">
        Size
        <input
          type="range"
          min={0.4}
          max={2.5}
          step={0.05}
          value={charm.scale}
          onChange={(e) => updateCharm(finger, charm.id, { scale: Number(e.target.value) })}
          className="w-32 accent-rose-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600"
        />
      </label>
      <label className="flex items-center justify-between gap-2">
        Rotate
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={charm.spin}
          onChange={(e) => updateCharm(finger, charm.id, { spin: Number(e.target.value) })}
          className="w-32 accent-rose-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-600"
        />
      </label>
      <button
        type="button"
        onClick={() => removeCharm(finger, charm.id)}
        className="self-start rounded-full border border-rose-300 px-4 py-2 text-rose-600 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
      >
        Remove
      </button>
    </div>
  )
}
