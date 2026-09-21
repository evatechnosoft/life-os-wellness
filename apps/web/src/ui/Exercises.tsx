import { useMemo, useState } from 'react'

import { alternatives, EXERCISES, type Exercise as ExerciseData, find, search } from '../lib/exercises'
import { Chip } from './Chip'
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

/** Ayni kasi baska aletle calistiran ilk iki hareket. Bos ise hic cizilmez. */
function Swaps({ ex }: { ex: ExerciseData }) {
  const swaps = alternatives(ex.id)
    .filter((a) => a.equipment !== ex.equipment)
    .slice(0, 2)
  if (swaps.length === 0) return null
  return (
    <span className="block truncate text-[10px] text-ink-faint/70">
      yerine: {swaps.map((a) => a.name).join(' · ')}
    </span>
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
          className="mt-3 min-h-11 rounded-pill bg-glass-strong px-4 text-sm"
        >
          ← Listeye dön
        </button>
        <Exercise ex={picked} onPick={setOpen} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 pt-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hareket ara"
        className="min-h-11 rounded-pill bg-glass-inset px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-a1"
      />

      {/* Iki filtre de yatay kaydirilan cip seridi: native select masaustu
          acilir menusu aciyordu, telefonda yabanci duruyor. Kenara tasarak
          (-mx-4) seridin devami oldugu gorunsun. */}
      <div aria-label="Bölge" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MUSCLE.map((m) => (
          <span key={m.id} className="shrink-0">
            <Chip label={m.label} selected={muscle === m.id} onToggle={() => setMuscle(m.id)} />
          </span>
        ))}
      </div>
      <div aria-label="Alet" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EQUIPMENT.map((o) => (
          <span key={o.id} className="shrink-0">
            <Chip label={o.label} selected={equipment === o.id} onToggle={() => setEquipment(o.id)} />
          </span>
        ))}
      </div>

      <p className="text-[11px] text-ink-faint">
        {list.length} hareket{list.length !== EXERCISES.length && ` · ${EXERCISES.length} içinden`}
      </p>

      {list.length === 0 ? (
        <p className="glass-card p-4 text-sm text-ink-dim">
          Bu filtrede hareket yok. Kütüphane şu an salonundaki aletler kadar — eksik bir alet
          varsa söyle, eklerim.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpen(e.id)}
                className="glass-card flex w-full items-center gap-3 p-2.5 text-left active:scale-[0.99]"
              >
                {e.media[0] === undefined ? (
                  <span className="size-14 shrink-0 rounded-field bg-glass-inset" />
                ) : (
                  <img
                    src={e.media[0].url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-14 shrink-0 rounded-field bg-bg-deep object-cover"
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{e.name}</span>
                  <span className="block truncate text-[11px] text-ink-faint">
                    {e.equipment_tr} · {e.primary_tr.join(' · ')}
                  </span>
                  {/* Salonda sorulan soru karta girmeden cevaplansin: makine doluysa
                      ayni kasi baska aletle calistiran iki hareket burada yaziyor. */}
                  <Swaps ex={e} />
                </span>
                <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0 text-ink-faint" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
