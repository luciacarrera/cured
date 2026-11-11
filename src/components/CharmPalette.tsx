import { CHARMS } from '../three/charms'
import type { CharmType } from '../types'
import { CharmIcon } from './CharmIcon'

export const CHARM_MIME = 'application/x-cured-charm'

interface Props {
  /** Tap / click to add at the centre of the nail (touch devices can't HTML-drag). */
  onTapAdd: (type: CharmType) => void
}

export function CharmPalette({ onTapAdd }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 sm:justify-center">
      {CHARMS.map((c) => (
        <button
          key={c.type}
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(CHARM_MIME, c.type)
            e.dataTransfer.effectAllowed = 'copy'
          }}
          onClick={() => onTapAdd(c.type)}
          className="group flex w-20 shrink-0 cursor-grab flex-col items-center gap-1 y2k-glass rounded-2xl px-2 py-2 text-xs font-semibold text-navy-600 transition hover:-translate-y-0.5 hover:border-baby-400 hover:shadow-[0_0_0_3px_rgb(167_216_255_/_0.6)] active:cursor-grabbing"
          title={`Drag ${c.label} onto the nail (or click to add)`}
        >
          <CharmIcon type={c.type} className="h-9 w-9 transition group-hover:scale-110" />
          {c.label}
        </button>
      ))}
    </div>
  )
}
