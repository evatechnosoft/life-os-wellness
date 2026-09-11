import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db } from '../lib/db'
import { estimateKcal } from '../lib/metrics'
import { useGoals } from '../lib/settings'
import { addProtein, addWorkout, deleteWorkout, saveDaily, saveRetro } from '../lib/store'
import { Assistant } from './Assistant'
import { Card, NumberField } from './Field'
import { Meals } from './Meals'
import { ReviewWorkout } from './ReviewWorkout'
import { Sleep } from './Sleep'
import { Watch } from './Watch'
import { draftToWorkout, emptyDraft, TYPES, WorkoutFields, type WorkoutDraft } from './WorkoutForm'

const PULSES = [30, 35, 40]

export function Today({ date }: { date: string }) {
  const goals = useGoals()
  const log = useLiveQuery(() => db.daily_log.get(date), [date])
  const workouts = useLiveQuery(() => db.workout.where('date').equals(date).toArray(), [date]) ?? []
  const retro = useLiveQuery(() => db.retro.get(date), [date])
  const [draft, setDraft] = useState<WorkoutDraft>(emptyDraft)

  const done = workouts.filter((w) => !w.needs_review)
  const protein = log?.protein_g ?? 0
  const eveningFirst = new Date().getHours() >= 20

  const submitWorkout = async () => {
    await addWorkout({ date, ...draftToWorkout(draft) })
    setDraft(emptyDraft)
  }

  const retroCard = (
    <Card title="Akşam retrosu">
      {(['went_well', 'resistance', 'experiment'] as const).map((field, i) => (
        <textarea
          key={field}
          rows={2}
          defaultValue={retro?.[field] ?? ''}
          placeholder={['Bugün ne iyi gitti?', 'Nerede zorlandım?', 'Yarın küçük deney?'][i]}
          onBlur={(e) => void saveRetro(date, { [field]: e.target.value || null })}
          className="mt-2 w-full rounded-field bg-glass-inset p-3 text-sm outline-none focus:ring-2 focus:ring-a1"
        />
      ))}
    </Card>
  )

  return (
    <div>
      <Assistant date={date} />

      {eveningFirst && retroCard}

      <Card title="Protein">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{protein}</span>
          <span className="text-sm text-ink-faint">/ {goals.protein_g} g</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-glass-strong">
          <div
            className="h-full bg-a1 transition-[width]"
            style={{ width: `${Math.min(100, (protein / goals.protein_g) * 100)}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          {PULSES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => void addProtein(date, g)}
              className="flex-1 rounded-field bg-a1/90 py-3 text-sm font-medium active:bg-a1"
            >
              +{g}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void addProtein(date, -PULSES[0]!)}
            disabled={protein === 0}
            className="rounded-field bg-glass-strong px-4 text-sm text-ink-dim disabled:opacity-40"
          >
            −
          </button>
        </div>
      </Card>

      <Meals date={date} />

      <Card title="Ölçüm">
        <NumberField
          label="Kilo (sabah, aç karnına)"
          unit="kg"
          step={0.1}
          value={log?.weight_kg}
          onCommit={(v) => void saveDaily(date, { weight_kg: v })}
        />
        <NumberField label="Adım" value={log?.steps} step={100} onCommit={(v) => void saveDaily(date, { steps: v })} />
        <div className="flex gap-3">
          <NumberField label="Tansiyon büyük" value={log?.bp_systolic} onCommit={(v) => void saveDaily(date, { bp_systolic: v })} />
          <NumberField label="küçük" value={log?.bp_diastolic} onCommit={(v) => void saveDaily(date, { bp_diastolic: v })} />
        </div>
      </Card>

      <ReviewWorkout date={date} bodyKg={log?.weight_kg ?? null} />

      <Card title="Antrenman">
        <WorkoutFields value={draft} onChange={setDraft} />

        <button
          type="button"
          onClick={() => void submitWorkout()}
          className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm active:bg-glass-strong"
        >
          Ekle
        </button>

        {done.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-ink-dim">
            {done.map((w) => {
              const kcal = estimateKcal(w, log?.weight_kg ?? null)
              return (
                <li key={w.id} className="flex items-center justify-between">
                  <span>
                    {TYPES.find((t) => t.id === w.type)?.label}
                    {w.sets_total ? ` · ${w.sets_total} set` : ''}
                    {w.weight_kg ? ` · ${w.weight_kg} kg` : ''}
                    {w.duration_min ? ` · ${w.duration_min} dk` : ''}
                    {w.muscle_groups.length > 0 ? ` · ${w.muscle_groups.join(', ')}` : ''}
                    {kcal != null ? ` · ~${kcal} kcal` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => void deleteWorkout(w.id)}
                    className="min-h-11 px-3 text-ink-faint"
                  >
                    sil
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Watch date={date} />

      <Sleep date={date} />

      {!eveningFirst && retroCard}
    </div>
  )
}
