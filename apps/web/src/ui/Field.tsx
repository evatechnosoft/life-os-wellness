import { useEffect, useState } from 'react'

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
          className="w-24 rounded-field bg-glass-inset px-3 py-2 text-right text-lg tabular-nums text-ink outline-none focus:ring-2 focus:ring-a1"
        />
        {unit && <span className="text-xs text-ink-faint">{unit}</span>}
      </span>
    </label>
  )
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-card mt-3 p-5">
      <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">{title}</h2>
      {children}
    </section>
  )
}
