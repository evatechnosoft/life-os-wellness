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
    <div className="flex gap-2 pt-3">
      {/* Bölge listesi dikey ve sabit: kaydırmadan hepsi görünür, seçim tek dokunuş. */}
      <nav aria-label="Bölge" className="sticky top-2 flex h-fit w-20 shrink-0 flex-col gap-1">
        {MUSCLE.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={muscle === m.id}
            onClick={() => setMuscle(m.id)}
            className={`rounded-field px-2 py-1.5 text-left text-[11px] leading-tight ${
              muscle === m.id ? 'bg-a1/90 text-solid' : 'bg-glass-inset text-ink-dim'
            }`}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hareket ara"
          className="min-h-10 rounded-field bg-glass-inset px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-a1"
        />
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as (typeof EQUIPMENT)[number]['id'])}
          aria-label="Alet"
          className="min-h-9 rounded-field bg-glass-inset px-3 text-xs text-ink-dim outline-none focus:ring-2 focus:ring-a1"
        >
          {EQUIPMENT.map((o) => (
            <option key={o.id} value={o.id} className="bg-solid">
              {o.label}
            </option>
          ))}
        </select>

        <p className="text-[11px] text-ink-faint">
          {list.length} hareket{list.length !== EXERCISES.length && ` · ${EXERCISES.length} içinden`}
        </p>

        {list.length === 0 ? (
          <p className="glass-card p-4 text-sm text-ink-dim">
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
                  className="glass-card flex w-full items-center gap-2.5 p-2 text-left"
                >
                  {e.media[0] === undefined ? (
                    <span className="size-11 shrink-0 rounded-field bg-glass-inset" />
                  ) : (
                    <img
                      src={e.media[0].url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-11 shrink-0 rounded-field bg-bg-deep object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{e.name}</span>
                    <span className="block truncate text-[11px] text-ink-faint">
                      {e.equipment_tr} · {e.primary_tr.join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
