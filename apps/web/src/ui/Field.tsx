import { useEffect, useState } from 'react'

import { setSection, useSections } from '../lib/ui'

interface NumberFieldProps {
  label: string
  unit?: string
  value: number | null | undefined
  step?: number
  onCommit: (value: number | null) => void
}

/** Commits on blur / Enter, not on every keystroke, so a half-typed number is never saved. */
export function NumberField({ label, unit, value, step = 1, onCommit }: NumberFieldProps) {
  const [draft, setDraft] = useState(value == null ? '' : String(value))

  useEffect(() => {
    setDraft(value == null ? '' : String(value))
  }, [value])

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed === '') return onCommit(null)
    const parsed = Number(trimmed)
    if (Number.isFinite(parsed)) onCommit(parsed)
    else setDraft(value == null ? '' : String(value))
  }

  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-ink-dim">{label}</span>
      <span className="flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="w-20 rounded-field bg-glass-inset px-3 py-2 text-right text-base tabular-nums text-ink outline-none focus:ring-2 focus:ring-a1"
        />
        {unit && <span className="text-xs text-ink-faint">{unit}</span>}
      </span>
    </label>
  )
}

interface CardProps {
  id?: string
  title: string
  /** Baslikta gorunen tek satir ozet: acmadan ne oldugu okunur (PLAN-UI S3). */
  summary?: string
  /** true ise native <details>; durum db.settings['ui_sections'] icinde saklanir. */
  collapsible?: boolean
  defaultOpen?: boolean
  children: React.ReactNode
}

const HEAD = 'text-[11px] font-medium uppercase tracking-wide text-ink-faint'

/**
 * Cam kart. `collapsible` verilirse native <details> ile katlanir - Radix ya da
 * baska bir kit gerekmiyor, klavye ve ekran okuyucu davranisi tarayicidan gelir.
 */
export function Card({ id, title, summary, collapsible, defaultOpen = false, children }: CardProps) {
  const sections = useSections()

  if (!collapsible) {
    return (
      <section id={id} className="glass-card mt-3 scroll-mt-2 p-4">
        <h2 className={`mb-1 ${HEAD}`}>{title}</h2>
        {children}
      </section>
    )
  }

  const key = id ?? title
  const open = sections[key] ?? defaultOpen

  return (
    <details
      id={id}
      open={open}
      onToggle={(e) => void setSection(key, e.currentTarget.open)}
      className="glass-card mt-3 scroll-mt-2 [&[open]_.chev]:rotate-90"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2 [&::-webkit-details-marker]:hidden">
        <h2 className={HEAD}>{title}</h2>
        {summary && <span className="ml-auto truncate text-xs text-ink-faint">{summary}</span>}
        <span aria-hidden className={`chev shrink-0 text-ink-faint transition-transform ${summary ? '' : 'ml-auto'}`}>
          ›
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  )
}
