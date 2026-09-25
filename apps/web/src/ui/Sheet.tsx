import { useEffect, useRef } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * Alttan acilan sayfa. Native <dialog>: odak tuzagi, ESC ve scrim tarayicidan
 * gelir - Radix ya da baska bir kit gerekmiyor. Dialog tum ekrani saydam kaplar,
 * panel altta durur; boylece dialog'un kendisine dusen tiklama = scrim tiklamasi.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        // ESC: dialog'u kendi basina kapatmasin, durum React'te tutuluyor.
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="m-0 h-dvh max-h-none w-dvw max-w-none bg-transparent p-0 text-ink backdrop:bg-[rgba(5,6,10,0.55)]"
    >
      <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-[24px] border-t border-edge bg-[rgba(13,16,23,0.92)] p-3 pb-[max(1.25rem,var(--safe-bottom))] backdrop-blur-[30px]">
        <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-edge" />
        <h2 className="mb-2 px-1 text-[11px] font-medium tracking-wide text-ink-faint uppercase">{title}</h2>
        {children}
      </div>
    </dialog>
  )
}
