import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'

import { swipeAction } from '../lib/swipe'

/** How long a swiped-away row can be taken back. */
const UNDO_MS = 5000

/**
 * List row: swipe right = edit, swipe left = delete with a 5 s undo strip.
 * The delete only runs when the strip expires (or the row unmounts), so undo
 * never has to rebuild a record. Hidden buttons keep both actions reachable
 * without a gesture (screen reader, keyboard).
 */
export function SwipeRow({
  label, onEdit, onDelete, children,
}: {
  label: string
  onEdit: () => void
  onDelete: () => Promise<void> | void
  children: ReactNode
}) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const pendingRef = useRef(false)
  const remove = useRef(onDelete)
  remove.current = onDelete

  const fire = () => {
    pendingRef.current = false
    void remove.current()
  }

  // Leaving the screen while the strip is up still deletes: the swipe was the decision.
  useEffect(() => () => {
    if (!pendingRef.current) return
    clearTimeout(timer.current)
    fire()
  }, [])

  const askDelete = () => {
    pendingRef.current = true
    setPending(true)
    timer.current = setTimeout(fire, UNDO_MS)
  }

  const undo = () => {
    clearTimeout(timer.current)
    pendingRef.current = false
    setPending(false)
  }

  const down = (e: PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY }
  }

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const x = e.clientX - start.current.x
    const y = e.clientY - start.current.y
    if (Math.abs(x) <= Math.abs(y)) return
    if (!dragging) {
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    setDx(Math.max(-120, Math.min(120, x)))
  }

  const up = (e: PointerEvent) => {
    const action = start.current
      ? swipeAction(e.clientX - start.current.x, e.clientY - start.current.y)
      : null
    start.current = null
    setDragging(false)
    setDx(0)
    if (action === 'edit') onEdit()
    if (action === 'delete') askDelete()
  }

  const cancel = () => {
    start.current = null
    setDragging(false)
    setDx(0)
  }

  if (pending) {
    return (
      <li className="flex items-center justify-between rounded-field bg-glass-inset px-3 text-xs text-ink-faint">
        <span>Silindi</span>
        <button type="button" onClick={undo} className="min-h-11 px-3 font-medium text-a1">
          Geri al
        </button>
      </li>
    )
  }

  return (
    <li className="relative overflow-hidden rounded-field">
      <div aria-hidden className="absolute inset-0 flex items-center justify-between px-4 text-xs font-medium">
        <span className={dx > 0 ? 'text-a1' : 'invisible'}>Düzenle</span>
        <span className={dx < 0 ? 'text-load' : 'invisible'}>Sil</span>
      </div>
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        style={{ transform: `translateX(${dx}px)` }}
        className={`relative touch-pan-y bg-surface ${dragging ? '' : 'transition-transform duration-200'}`}
      >
        {children}
      </div>
      <button type="button" onClick={onEdit} className="sr-only">{label} düzenle</button>
      <button type="button" onClick={askDelete} className="sr-only">{label} sil</button>
    </li>
  )
}
