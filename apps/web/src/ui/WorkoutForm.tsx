import type { Workout, WorkoutType } from '../lib/db'
import { BodyPicker, type Muscle } from './BodyPicker'

export const TYPES: { id: WorkoutType; label: string }[] = [
  { id: 'resistance', label: 'Direnç' },
  { id: 'cardio', label: 'Kardiyo' },
  { id: 'walk', label: 'Yürüyüş' },
  { id: 'rest', label: 'Dinlenme' },
]

export interface WorkoutDraft {
  type: WorkoutType
  sets: string
  /** Seansta yapilan toplam tekrar. Bos gecilebilir - zorunlu alan giris suresini uzatir. */
  reps: string
  minutes: string
  weight: string
  groups: string[]
}

export const emptyDraft: WorkoutDraft = { type: 'resistance', sets: '', reps: '', minutes: '', weight: '', groups: [] }

/** Metin alanlarini sayiya cevirir; bos alan "girilmedi" demektir, sifir degil. */
export function draftToWorkout(draft: WorkoutDraft): {
  type: WorkoutType
  duration_min: number | null
  sets_total: number | null
  reps_total: number | null
  weight_kg: number | null
  muscle_groups: string[]
} {
  return {
    type: draft.type,
    duration_min: draft.minutes === '' ? null : Number(draft.minutes),
    sets_total: draft.sets === '' ? null : Number(draft.sets),
    reps_total: draft.reps === '' ? null : Number(draft.reps),
    weight_kg: draft.weight === '' ? null : Number(draft.weight),
    muscle_groups: draft.groups,
  }
}

/** Inverse of draftToWorkout: prefills the form when a logged session is edited. */
export function workoutToDraft(w: Workout): WorkoutDraft {
  const text = (n: number | null | undefined) => (n == null ? '' : String(n))
  return {
    type: w.type,
    sets: text(w.sets_total),
    reps: text(w.reps_total),
    minutes: text(w.duration_min),
    weight: text(w.weight_kg),
    groups: w.muscle_groups,
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
            className={`flex-1 rounded-field py-2 text-xs ${value.type === t.id ? 'bg-glass-strong text-ink' : 'bg-glass-inset text-ink-faint'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {value.type === 'resistance' && (
        <BodyPicker
          selected={value.groups as Muscle[]}
          onToggle={(m) =>
            set({ groups: value.groups.includes(m) ? value.groups.filter((x) => x !== m) : [...value.groups, m] })
          }
        />
      )}

      <div className="mt-3 grid grid-cols-4 gap-2">
        {value.type === 'resistance' ? (
          <>
            <Stat label="set" value={value.sets} onChange={(sets) => set({ sets })} />
            <Stat label="tekrar" value={value.reps} onChange={(reps) => set({ reps })} />
            <Stat label="kg" value={value.weight} decimal onChange={(weight) => set({ weight })} />
          </>
        ) : null}
        {(showMinutes || value.type !== 'resistance') && (
          <Stat label="dk" value={value.minutes} onChange={(minutes) => set({ minutes })} />
        )}
      </div>
    </>
  )
}

/**
 * Etiket kutunun ustunde sabit: placeholder yazinca kayboluyordu, dort dolu kutuda
 * hangisinin set hangisinin tekrar oldugu bir bakista okunmuyordu.
 */
function Stat({ label, value, decimal = false, onChange }: {
  label: string
  value: string
  decimal?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
      <input
        type="number"
        inputMode={decimal ? 'decimal' : 'numeric'}
        placeholder="—"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-field px-2 py-2.5 text-center text-lg font-semibold tabular-nums outline-none focus:ring-2 focus:ring-a1 ${
          value === '' ? 'bg-glass-inset text-ink-dim' : 'bg-a1/15 text-ink'
        }`}
      />
    </label>
  )
}
