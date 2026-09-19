interface ChipProps {
  label: string
  selected: boolean
  onToggle: () => void
}

/** Tek boyutlu seçim çipi; ekran ölçeği PLAN-UI §11-1'de sabitlendi. */
export function Chip({ label, selected, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`rounded-pill px-3 py-1.5 text-xs ${selected ? 'bg-a1/90 text-solid' : 'bg-glass-inset text-ink-faint'}`}
    >
      {label}
    </button>
  )
}
