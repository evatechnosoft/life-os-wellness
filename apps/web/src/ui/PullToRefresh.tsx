import { useRef, useState, type ReactNode } from 'react'

import { pullFrom, pullLabel, type PullState } from '../lib/pull'

const IDLE: PullState = { distance: 0, armed: false, active: false }

/**
 * Asagi cekip birakinca yenileme. Karar `lib/pull.ts`'te; burasi yalniz parmagi
 * dinler ve gostergeyi cizer.
 *
 * ponytail: dokunma olaylari yeterli - fare ile cekme yok. Telefon icin yazildi,
 * masaustunde sayfa zaten F5 ile yenileniyor.
 */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: ReactNode }) {
  const [state, setState] = useState<PullState>(IDLE)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)

  const scrollTop = (): number => document.scrollingElement?.scrollTop ?? window.scrollY

  const begin = (e: React.TouchEvent) => {
    if (refreshing || scrollTop() > 0) return
    startY.current = e.touches[0]?.clientY ?? null
  }

  const move = (e: React.TouchEvent) => {
    const y = e.touches[0]?.clientY
    if (y === undefined) return
    setState(pullFrom(startY.current, y, scrollTop()))
  }

  const end = () => {
    const armed = state.armed
    startY.current = null
    setState(IDLE)
    if (!armed || refreshing) return
    setRefreshing(true)
    // Yenileme hatasi ekrani kilitlemesin: gosterge her durumda kapanir, hata
    // zaten ilgili ekranda (senkron rozeti, Ayar kartı) gorunuyor.
    void onRefresh()
      .catch(() => {})
      .finally(() => setRefreshing(false))
  }

  const shown = refreshing ? 44 : state.distance

  return (
    <div onTouchStart={begin} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
      <div
        className="flex items-end justify-center overflow-hidden text-xs text-ink-faint"
        style={{ height: shown, transition: state.active ? 'none' : 'height 200ms var(--ease-out)' }}
        aria-live="polite"
      >
        {shown > 12 && <span className="pb-2">{pullLabel(state, refreshing)}</span>}
      </div>
      {children}
    </div>
  )
}
