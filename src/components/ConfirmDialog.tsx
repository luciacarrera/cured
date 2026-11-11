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
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-transparent p-0 backdrop:bg-cocoa-700/40 backdrop:backdrop-blur-sm"
    >
      <div className="rounded-3xl border border-blush-200 bg-cream p-6 text-center shadow-xl">
        <h2 id="confirm-dialog-title" className="font-display text-3xl text-cocoa-700">
          {title}
        </h2>
        <p className="mt-2 text-sm text-cocoa-500">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="rounded-full border border-blush-200 bg-white px-5 py-2.5 text-sm text-cocoa-600 shadow-sm transition hover:border-rose-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-rose-400 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-200 transition hover:bg-rose-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
