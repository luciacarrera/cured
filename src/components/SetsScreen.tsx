import { useEffect, useRef, useState } from 'react'
import { HAND_ART } from '../data/handArt'
import { nextSetName, sortedSets, useDesign } from '../store/designStore'
import { exportStl, stlFileName } from '../three/exportStl'
import type { NailBase } from '../three/loadNail'
import type { NailSet } from '../types'
import { ConfirmDialog } from './ConfirmDialog'
import { SetNameDialog } from './SetNameDialog'
import { SetThumbnail } from './SetThumbnail'

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
function edited(ts: number) {
  const mins = Math.round((ts - Date.now()) / 60000)
  if (mins > -1) return 'Edited just now'
  if (mins > -60) return `Edited ${rtf.format(mins, 'minute')}`
  const hours = Math.round(mins / 60)
  if (hours > -24) return `Edited ${rtf.format(hours, 'hour')}`
  const days = Math.round(hours / 24)
  if (days > -7) return `Edited ${rtf.format(days, 'day')}`
  return `Edited ${new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

function deleteMessage(set: NailSet | null) {
  if (!set) return ''
  const { charms } = stats(set)
  const what = charms === 0 ? '' : ` and its ${charms} charm${charms === 1 ? '' : 's'}`
  return `“${set.name}”${what} will be gone for good.`
}

const stats = (set: NailSet) => {
  const lists = Object.values(set.designs)
  return {
    done: lists.filter((d) => d.length > 0).length,
    charms: lists.reduce((n, d) => n + d.length, 0),
  }
}

/** The library: every saved set, plus a way to start a new one. */
export function SetsScreen({ nail }: { nail: NailBase | null }) {
  const setsById = useDesign((s) => s.sets)
  const createSet = useDesign((s) => s.createSet)
  const openSet = useDesign((s) => s.openSet)
  const renameSet = useDesign((s) => s.renameSet)
  const duplicateSet = useDesign((s) => s.duplicateSet)
  const deleteSet = useDesign((s) => s.deleteSet)

  const sets = sortedSets(setsById)
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<NailSet | null>(null)
  const [deleting, setDeleting] = useState<NailSet | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const download = async (set: NailSet) => {
    setDownloading(set.id)
    setError(null)
    try {
      await exportStl(set.designs, set.sizes, stlFileName(set.name))
    } catch (e) {
      setError(`Couldn't download “${set.name}”. ${(e as Error).message}`)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="flex items-end justify-between gap-4 px-4 pt-5 sm:px-6 sm:pt-6">
        <div>
          <h1 className="flex items-center gap-2 font-display text-4xl leading-none font-bold tracking-wide sm:text-5xl">
            <span className="y2k-chrome-text" data-text="Cured">
              Cured
            </span>
            <span className="sparkle text-xl" aria-hidden>
              ✦
            </span>
          </h1>
          <p className="mt-1.5 font-pixel text-xl text-navy-500 tabular-nums">
            {sets.length === 0 ? 'Press-ons, designed by you' : `Your sets · ${sets.length}`}
          </p>
        </div>
        {sets.length > 0 && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="y2k-gloss rounded-full px-4 py-2.5 font-display text-sm font-semibold whitespace-nowrap sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="y2k-chrome-label">+ New set</span>
          </button>
        )}
      </header>

      {error && (
        <p role="alert" className="px-4 pt-3 text-sm text-rose-600 sm:px-6">
          {error}
        </p>
      )}

      {sets.length === 0 ? (
        <EmptyState onCreate={() => setCreating(true)} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 px-4 pt-6 pb-10 min-[480px]:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-4">
          {/* Phones already have the header button; the tile would fill the first screen. */}
          <li className="max-[479px]:hidden">
            <NewSetTile onClick={() => setCreating(true)} />
          </li>
          {sets.map((set) => (
            <li key={set.id}>
              <SetCard
                set={set}
                nail={nail}
                onOpen={() => openSet(set.id)}
                onRename={() => setRenaming(set)}
                onDuplicate={() => duplicateSet(set.id)}
                onDownload={() => download(set)}
                downloading={downloading === set.id}
                onDelete={() => setDeleting(set)}
              />
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <SetNameDialog
          open
          mode="create"
          initialName={nextSetName(setsById)}
          sizeSources={sets}
          onSubmit={(name, sizesFrom) => {
            setCreating(false)
            createSet(name, sizesFrom)
          }}
          onCancel={() => setCreating(false)}
        />
      )}
      {renaming && (
        <SetNameDialog
          open
          mode="rename"
          initialName={renaming.name}
          onSubmit={(name) => {
            renameSet(renaming.id, name)
            setRenaming(null)
          }}
          onCancel={() => setRenaming(null)}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete set?"
        message={deleteMessage(deleting)}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) deleteSet(deleting.id)
          setDeleting(null)
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-6 text-center">
      <div className="y2k-glass relative w-full max-w-md overflow-hidden rounded-[2rem] px-6 pt-8 pb-0">
        <p className="font-display text-2xl font-bold tracking-wide sm:text-3xl">
          <span className="y2k-chrome-text" data-text="Start your first set">
            Start your first set
          </span>
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-navy-500">
          A set is ten press-ons, one per finger. Design each nail, then download them all as one print-ready
          STL.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="y2k-gloss mt-5 rounded-full px-7 py-3 font-display text-base font-semibold"
        >
          <span className="y2k-chrome-label">+ New set</span>
        </button>
        <img
          src={HAND_ART.url}
          alt=""
          className="mx-auto mt-6 -mb-16 w-full max-w-sm opacity-90 drop-shadow-[0_6px_16px_rgb(58_154_217/0.25)]"
        />
      </div>
    </div>
  )
}

function NewSetTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-56 w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-baby-400/70 bg-white/35 p-6 text-navy-500 transition hover:border-baby-500 hover:bg-white/70"
    >
      <span
        aria-hidden
        className="y2k-gloss grid size-14 place-items-center rounded-full font-display text-3xl leading-none transition motion-safe:group-hover:scale-110"
      >
        <span className="y2k-chrome-label -mt-0.5">+</span>
      </span>
      <span className="font-display text-lg font-semibold text-navy-700">New set</span>
      <span className="font-pixel text-lg leading-none">Ten fresh nails</span>
    </button>
  )
}

interface CardProps {
  set: NailSet
  nail: NailBase | null
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onDownload: () => void
  downloading: boolean
  onDelete: () => void
}

function SetCard({ set, nail, onOpen, onRename, onDuplicate, onDownload, downloading, onDelete }: CardProps) {
  const { done, charms } = stats(set)
  return (
    <article className="y2k-glass group relative flex h-full flex-col rounded-3xl transition has-[[aria-expanded=true]]:z-20 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgb(58_154_217/0.25)]">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-t-3xl border-b border-chrome/70 bg-gradient-to-b from-baby-50 to-baby-100/60">
        <SetThumbnail set={set} nail={nail} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 pr-12">
        <h2 className="truncate font-display text-lg leading-tight font-semibold text-navy-700">
          {/* The whole card is the click target for opening the set. */}
          <button
            type="button"
            onClick={onOpen}
            className="text-left outline-none after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-baby-500"
          >
            {set.name}
          </button>
        </h2>
        <Progress done={done} />
        <p className="text-xs text-navy-500">
          {charms === 0 ? 'No charms yet' : `${charms} charm${charms === 1 ? '' : 's'}`} · {edited(set.updatedAt)}
        </p>
      </div>
      <CardMenu
        name={set.name}
        items={[
          { label: 'Open', onSelect: onOpen },
          { label: 'Rename', onSelect: onRename },
          { label: 'Duplicate', onSelect: onDuplicate },
          {
            label: downloading ? 'Preparing…' : 'Download STL',
            onSelect: onDownload,
            disabled: charms === 0 || downloading || !nail,
            hint: charms === 0 ? 'Add a charm first' : undefined,
          },
          { label: 'Delete', onSelect: onDelete, danger: true, divider: true },
        ]}
      />
    </article>
  )
}

/** Ten pixel pips, one per nail, so progress reads at a glance. */
function Progress({ done }: { done: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`${done} of 10 nails done`} role="img">
      <div className="flex gap-[3px]" aria-hidden>
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2 rounded-[2px] ${i < done ? 'bg-baby-400 shadow-[inset_0_1px_0_rgb(255_255_255/0.7)]' : 'bg-navy-400/15'}`}
          />
        ))}
      </div>
      <span className="font-pixel text-lg leading-none text-navy-500 tabular-nums" aria-hidden>
        {done}/10
      </span>
    </div>
  )
}

interface MenuItem {
  label: string
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
  /** Shown as a tooltip, mainly to explain why an item is disabled. */
  hint?: string
  /** Draw a divider above this item. */
  divider?: boolean
}

function CardMenu({ name, items }: { name: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={ref} className="absolute right-2 bottom-3 z-10">
      <button
        type="button"
        aria-label={`More actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-10 place-items-center rounded-full text-xl leading-none text-navy-500 transition hover:bg-white/80"
      >
        <span aria-hidden className="-mt-2">
          …
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="y2k-glass absolute right-0 bottom-11 w-44 rounded-2xl p-1.5 shadow-xl"
        >
          {items.map((it) => (
            <div key={it.label}>
              {it.divider && <hr className="my-1 border-chrome" />}
              <button
                type="button"
                role="menuitem"
                disabled={it.disabled}
                title={it.hint}
                onClick={() => {
                  setOpen(false)
                  it.onSelect()
                }}
                className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  it.danger ? 'text-rose-600 enabled:hover:bg-rose-50' : 'text-navy-700 enabled:hover:bg-baby-50'
                }`}
              >
                {it.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
