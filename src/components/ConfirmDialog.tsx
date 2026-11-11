import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Modal "are you sure?" prompt. Escape and backdrop clicks count as cancel. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        // Escape: keep the dialog under React's control instead of letting the browser close it.
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-transparent p-0 backdrop:bg-navy-700/40 backdrop:backdrop-blur-sm"
    >
      <div className="y2k-glass rounded-3xl p-6 text-center shadow-xl">
        <h2 id="confirm-dialog-title" className="font-display text-3xl font-bold tracking-wide">
          <span className="y2k-chrome-text" data-text={title}>
            {title}
          </span>
        </h2>
        <p className="mt-2 text-sm text-navy-500">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="y2k-gloss rounded-full px-5 py-2.5 font-display text-sm font-semibold"
          >
            <span className="y2k-chrome-label">{cancelLabel}</span>
          </button>
          {/* Destructive action stays red; rose-600 keeps white text at AA contrast. */}
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-600 px-5 py-2.5 font-display text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
