import { useEffect, useId, useRef, useState } from 'react'
import type { NailSet } from '../types'

interface Props {
  open: boolean
  mode: 'create' | 'rename'
  initialName: string
  /** Sets whose finger sizes can be copied into a new set, most recent first. */
  sizeSources?: NailSet[]
  onSubmit: (name: string, sizesFrom: string | null) => void
  onCancel: () => void
}

/**
 * Mount this only while it's open (`{show && <SetNameDialog open … />}`) so
 * the fields start fresh each time.
 *
 * Name a new set (and pick where its nail sizes come from), or rename one.
 * Sizes default to the most recent set, since people usually size their own
 * fingers once and reuse them.
 */
export function SetNameDialog({ open, mode, initialName, sizeSources = [], onSubmit, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const ids = useId()
  const [name, setName] = useState(initialName)
  const [sizesFrom, setSizesFrom] = useState<string>(sizeSources[0]?.id ?? '')

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      requestAnimationFrame(() => inputRef.current?.select())
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const create = mode === 'create'
  const title = create ? 'New set' : 'Rename set'
  const canSubmit = name.trim().length > 0

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${ids}-title`}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-transparent p-0 backdrop:bg-navy-700/40 backdrop:backdrop-blur-sm"
    >
      <form
        className="y2k-glass rounded-3xl p-6 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) onSubmit(name.trim(), create && sizesFrom ? sizesFrom : null)
        }}
      >
        <h2 id={`${ids}-title`} className="text-center font-display text-3xl font-bold tracking-wide">
          <span className="y2k-chrome-text" data-text={title}>
            {title}
          </span>
        </h2>

        <label htmlFor={`${ids}-name`} className="mt-5 block font-pixel text-xl text-navy-500">
          Name
        </label>
        <input
          ref={inputRef}
          id={`${ids}-name`}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="Birthday set, Chrome hearts…"
          className="mt-1 w-full rounded-2xl border border-chrome bg-white/90 px-4 py-3 font-display text-lg text-navy-700 shadow-inner placeholder:text-navy-400/70"
        />

        {create && sizeSources.length > 0 && (
          <fieldset className="mt-5">
            <legend className="font-pixel text-xl text-navy-500">Nail sizes</legend>
            <div className="mt-1 grid gap-2">
              <SizeOption
                name={`${ids}-sizes`}
                checked={sizesFrom !== ''}
                onChange={() => setSizesFrom(sizeSources[0].id)}
                title="Reuse my sizes"
                detail={
                  <>
                    from{' '}
                    <select
                      aria-label="Set to copy sizes from"
                      value={sizesFrom || sizeSources[0].id}
                      onChange={(e) => setSizesFrom(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="max-w-[12rem] truncate rounded-lg border border-chrome bg-white px-1.5 py-0.5 text-navy-700"
                    >
                      {sizeSources.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </>
                }
              />
              <SizeOption
                name={`${ids}-sizes`}
                checked={sizesFrom === ''}
                onChange={() => setSizesFrom('')}
                title="Standard sizes"
                detail="Average fit, adjust per nail later"
              />
            </div>
          </fieldset>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 font-display text-sm font-semibold text-navy-500 transition hover:bg-white/70"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="y2k-gloss rounded-full px-6 py-2.5 font-display text-sm font-semibold disabled:opacity-50"
          >
            <span className="y2k-chrome-label">{create ? 'Create set' : 'Save'}</span>
          </button>
        </div>
      </form>
    </dialog>
  )
}

function SizeOption({
  name,
  checked,
  onChange,
  title,
  detail,
}: {
  name: string
  checked: boolean
  onChange: () => void
  title: string
  detail: React.ReactNode
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
        checked ? 'border-baby-400 bg-baby-50 shadow-[0_0_0_3px_rgb(167_216_255/0.5)]' : 'border-chrome bg-white/60 hover:bg-white'
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 accent-baby-500" />
      <span className="text-sm">
        <span className="block font-display text-base font-semibold text-navy-700">{title}</span>
        <span className="text-navy-500">{detail}</span>
      </span>
    </label>
  )
}
