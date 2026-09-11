import type { WorkoutType } from '../lib/db'

export const TYPES: { id: WorkoutType; label: string }[] = [
  { id: 'resistance', label: 'Direnç' },
  { id: 'cardio', label: 'Kardiyo' },
  { id: 'walk', label: 'Yürüyüş' },
  { id: 'rest', label: 'Dinlenme' },
]
const MUSCLES = ['göğüs', 'sırt', 'bacak', 'omuz', 'kol', 'karın']

export interface WorkoutDraft {
  type: WorkoutType
  sets: string
  minutes: string
  weight: string
  groups: string[]
}

export const emptyDraft: WorkoutDraft = { type: 'resistance', sets: '', minutes: '', weight: '', groups: [] }

/** Metin alanlarini sayiya cevirir; bos alan "girilmedi" demektir, sifir degil. */
export function draftToWorkout(draft: WorkoutDraft): {
  type: WorkoutType
  duration_min: number | null
  sets_total: number | null
  weight_kg: number | null
  muscle_groups: string[]
} {
  return {
    type: draft.type,
    duration_min: draft.minutes === '' ? null : Number(draft.minutes),
    sets_total: draft.sets === '' ? null : Number(draft.sets),
    weight_kg: draft.weight === '' ? null : Number(draft.weight),
    muscle_groups: draft.groups,
  }
}

/**
 * Antrenman alanlari. Iki yerde kullaniliyor: Bugun ekraninda elle giris, ve
 * saatin buldugu seansi tamamlayan "bu neydi?" kartinda.
 */
export function WorkoutFields({
  value,
  onChange,
  showMinutes = false,
}: {
  value: WorkoutDraft
  onChange: (draft: WorkoutDraft) => void
  showMinutes?: boolean
}) {
  const set = (patch: Partial<WorkoutDraft>) => onChange({ ...value, ...patch })

  return (
    <>
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => set({ type: t.id })}
            className={`flex-1 rounded-field py-3 text-xs ${value.type === t.id ? 'bg-glass-strong text-ink' : 'bg-glass-inset text-ink-faint'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {value.type === 'resistance' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {MUSCLES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() =>
                set({ groups: value.groups.includes(m) ? value.groups.filter((x) => x !== m) : [...value.groups, m] })
              }
              className={`min-h-11 rounded-full px-4 text-xs ${value.groups.includes(m) ? 'bg-a1/90' : 'bg-glass-inset text-ink-faint'}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {value.type === 'resistance' ? (
          <>
            <input
              type="number"
              inputMode="numeric"
              aria-label="set"
              placeholder="set"
              value={value.sets}
              onChange={(e) => set({ sets: e.target.value })}
              className="w-20 rounded-field bg-glass-inset px-3 py-3 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1"
            />
            <input
              type="number"
              inputMode="decimal"
              aria-label="ağırlık (kg)"
              placeholder="kg"
              value={value.weight}
              onChange={(e) => set({ weight: e.target.value })}
              className="w-20 rounded-field bg-glass-inset px-3 py-3 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1"
            />
          </>
        ) : null}
        {(showMinutes || value.type !== 'resistance') && (
          <input
            type="number"
            inputMode="numeric"
            aria-label="süre (dakika)"
            placeholder="dk"
            value={value.minutes}
            onChange={(e) => set({ minutes: e.target.value })}
            className="w-20 rounded-field bg-glass-inset px-3 py-3 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1"
          />
        )}
      </div>
    </>
  )
}
