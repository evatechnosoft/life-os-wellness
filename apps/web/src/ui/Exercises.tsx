import { useMemo, useState } from 'react'

import { EXERCISES, find, search } from '../lib/exercises'
import { Exercise } from './Exercise'

/** Salonda sorulan gercek soru: "hangi aletle?" Liste once ona gore daralir. */
const EQUIPMENT = [
  { id: 'all', label: 'Hepsi' },
  { id: 'machine', label: 'Makine' },
  { id: 'dumbbell', label: 'Dambıl' },
  { id: 'cable', label: 'Kablo' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'body only', label: 'Vücut' },
] as const

const MUSCLE = [
  { id: 'all', label: 'Hepsi' },
  { id: 'chest', label: 'Göğüs' },
  { id: 'lats', label: 'Sırt' },
  { id: 'quadriceps', label: 'Ön bacak' },
  { id: 'hamstrings', label: 'Arka bacak' },
  { id: 'glutes', label: 'Kalça' },
  { id: 'shoulders', label: 'Omuz' },
  { id: 'abdominals', label: 'Karın' },
  { id: 'biceps', label: 'Biseps' },
  { id: 'triceps', label: 'Triseps' },
] as const

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-9 shrink-0 rounded-pill px-3.5 text-xs ${
            value === o.id ? 'bg-glass-strong text-ink' : 'bg-glass text-ink-faint'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Hareket kutuphanesi (PLAN-COACH S2). Katalog derlemeye gomulu, gorseller
 * ilk gosterimde inip IndexedDB'de kaliyor - ikinci acilis cevrimdisi calisir.
 */
export function Exercises() {
  const [query, setQuery] = useState('')
  const [equipment, setEquipment] = useState<(typeof EQUIPMENT)[number]['id']>('all')
  const [muscle, setMuscle] = useState<(typeof MUSCLE)[number]['id']>('all')
  const [open, setOpen] = useState<string | null>(null)

  const list = useMemo(
    () =>
      search(query)
        .filter((e) => equipment === 'all' || e.equipment === equipment)
        .filter((e) => muscle === 'all' || e.primary.includes(muscle)),
    [query, equipment, muscle],
  )

  const picked = open === null ? null : find(open)

  if (picked !== null) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="mt-3 min-h-11 rounded-field bg-glass-strong px-4 text-sm"
        >
          ← Listeye dön
        </button>
        <Exercise ex={picked} onPick={setOpen} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 pt-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hareket ara"
        className="min-h-11 rounded-field bg-glass-inset px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-a1"
      />
      <Chips options={EQUIPMENT} value={equipment} onChange={setEquipment} />
      <Chips options={MUSCLE} value={muscle} onChange={setMuscle} />

      <p className="text-xs text-ink-faint">
        {list.length} hareket{list.length !== EXERCISES.length && ` · ${EXERCISES.length} içinden`}
      </p>

      {list.length === 0 ? (
        <p className="glass-card mt-1 p-5 text-sm text-ink-dim">
          Bu filtrede hareket yok. Kütüphane şu an salonundaki aletler kadar — eksik bir alet
          varsa söyle, eklerim.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpen(e.id)}
                className="glass-card flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex-1">
                  <span className="block text-sm text-ink">{e.name}</span>
                  <span className="block text-xs text-ink-faint">{e.primary_tr.join(' · ')}</span>
                </span>
                <span className="rounded-pill bg-glass-strong px-2.5 py-1 text-[10px] uppercase tracking-wider text-ink-faint">
                  {e.equipment_tr}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
