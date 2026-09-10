import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { db, type WorkoutType } from '../lib/db'
import { useGoals } from '../lib/settings'
import { addProtein, addWorkout, deleteWorkout, saveDaily, saveRetro } from '../lib/store'
import { Card, NumberField } from './Field'
import { Sleep } from './Sleep'
import { Watch } from './Watch'

const PULSES = [30, 35, 40]
const TYPES: { id: WorkoutType; label: string }[] = [
  { id: 'resistance', label: 'Direnç' },
  { id: 'cardio', label: 'Kardiyo' },
  { id: 'walk', label: 'Yürüyüş' },
  { id: 'rest', label: 'Dinlenme' },
]
const MUSCLES = ['göğüs', 'sırt', 'bacak', 'omuz', 'kol', 'karın']

export function Today({ date }: { date: string }) {
  const goals = useGoals()
  const log = useLiveQuery(() => db.daily_log.get(date), [date])
  const workouts = useLiveQuery(() => db.workout.where('date').equals(date).toArray(), [date]) ?? []
  const retro = useLiveQuery(() => db.retro.get(date), [date])
  const [type, setType] = useState<WorkoutType>('resistance')
  const [sets, setSets] = useState('')
  const [minutes, setMinutes] = useState('')
  const [groups, setGroups] = useState<string[]>([])

  const protein = log?.protein_g ?? 0
  const eveningFirst = new Date().getHours() >= 20

  const submitWorkout = async () => {
    await addWorkout({
      date,
      type,
      duration_min: minutes === '' ? null : Number(minutes),
      sets_total: sets === '' ? null : Number(sets),
      muscle_groups: groups,
    })
    setSets('')
    setMinutes('')
    setGroups([])
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

      <Card title="Antrenman">
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`flex-1 rounded-field py-2 text-xs ${type === t.id ? 'bg-glass-strong text-ink' : 'bg-glass-inset text-ink-faint'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {type === 'resistance' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setGroups((g) => (g.includes(m) ? g.filter((x) => x !== m) : [...g, m]))}
                className={`rounded-full px-3 py-1 text-xs ${groups.includes(m) ? 'bg-a1/90' : 'bg-glass-inset text-ink-faint'}`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={type === 'resistance' ? 'set' : 'dk'}
            value={type === 'resistance' ? sets : minutes}
            onChange={(e) => (type === 'resistance' ? setSets : setMinutes)(e.target.value)}
            className="w-24 rounded-field bg-glass-inset px-3 py-2 text-center tabular-nums outline-none focus:ring-2 focus:ring-a1"
          />
          <button
            type="button"
            onClick={() => void submitWorkout()}
            className="flex-1 rounded-field bg-glass-strong py-2 text-sm active:bg-glass-strong"
          >
            Ekle
          </button>
        </div>

        {workouts.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-ink-dim">
            {workouts.map((w) => (
              <li key={w.id} className="flex items-center justify-between">
                <span>
                  {TYPES.find((t) => t.id === w.type)?.label}
                  {w.sets_total ? ` · ${w.sets_total} set` : ''}
                  {w.duration_min ? ` · ${w.duration_min} dk` : ''}
                  {w.muscle_groups.length > 0 ? ` · ${w.muscle_groups.join(', ')}` : ''}
                </span>
                <button type="button" onClick={() => void deleteWorkout(w.id)} className="px-2 text-ink-faint">
                  sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Watch date={date} />

      <Sleep date={date} />

      {!eveningFirst && retroCard}
    </div>
  )
}
