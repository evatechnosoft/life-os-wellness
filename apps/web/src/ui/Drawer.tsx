import { useEffect } from 'react'

/**
 * Sol ustten acilan tam sayfa menu. Alt cubuk gunluk dort ise ayrilinca ikincil
 * sayfalar (hareket kutuphanesi, ayarlar, dokumanlar) buraya tasindi - sekme
 * kaldirmak onlari kor noktaya dusurmesin (spec S2).
 */
export type DrawerPage = { id: string; label: string; hint?: string }

export function Drawer({
  open, pages, onPick, onClose,
}: {
  open: boolean
  pages: DrawerPage[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  // Acikken arka plan kaymasin: telefonda menuden kayarken sayfa altta kayiyordu.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-30 flex">
      <button type="button" aria-label="Menüyü kapat" onClick={onClose}
        className="absolute inset-0 bg-bg-deep/80" />
      <nav className="relative flex h-full w-[82%] max-w-xs flex-col gap-1 overflow-y-auto bg-solid px-2 py-6">
        <p className="px-3 pb-3 text-xs tracking-[0.2em] text-ink-faint uppercase">Bölümler</p>
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => { onPick(page.id); onClose() }}
            className="flex flex-col items-start rounded-field px-3 py-3 text-left active:bg-glass"
          >
            <span className="text-[15px] text-ink">{page.label}</span>
            {page.hint && <span className="text-xs text-ink-faint">{page.hint}</span>}
          </button>
        ))}
      </nav>
    </div>
  )
}
