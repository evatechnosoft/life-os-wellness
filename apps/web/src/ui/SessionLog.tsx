import { useLiveQuery } from 'dexie-react-hooks'

import { db, type Workout } from '../lib/db'
import { find } from '../lib/exercises'
import { buildWorkout, bump, prefill, type LogRow } from '../lib/sessionLog'
import { upsertWorkout } from '../lib/store'
import { planFor, useWorkoutPlan } from '../lib/workoutPlan'
import { Card } from './Field'

type Stored = { workoutId: string; rows: LogRow[] }

const key = (date: string) => `session_log:${date}`

/**
 * Salon gunu set kaydi. Plan "lift" degilse cizilmez. Durum settings'te gun
 * anahtariyla durur: uygulama kapanip acilinca isaretler kaybolmaz.
 */
export function SessionLog({ date, today }: { date: string; today: Workout[] }) {
  const plan = useWorkoutPlan()
  const day = planFor(plan, date)
  const stored = useLiveQuery(() => db.settings.get(key(date)), [date])
  const history = useLiveQuery(() => db.workout.toArray(), []) ?? []

  if (day?.day_type !== 'lift' || !day.exercises?.length) return null

  const state = stored?.value as Stored | undefined
  // Saatin bugun buldugu direnc seansi varsa setler ona yazilir - ayni antrenman iki satir olmaz.
  const base = today.find((w) => w.type === 'resistance')
  const current: Stored = state ?? {
    workoutId: base?.id ?? crypto.randomUUID(),
    rows: prefill(day.exercises, history, date, () => crypto.randomUUID()),
  }

  const save = async (rows: LogRow[], sync: boolean): Promise<void> => {
    const next = { ...current, rows }
    await db.settings.put({ key: key(date), value: next })
    if (!sync) return
    const existing = today.find((w) => w.id === next.workoutId) ?? base
    // ponytail: isareti geri alinan set sunucuda kalir (POST yalniz upsert eder);
    // salonda nadir, gerekirse exercise_set DELETE ucu eklenir.
    await upsertWorkout(buildWorkout(next.workoutId, date, rows, existing))
  }

  const update = (i: number, row: LogRow, sync: boolean) =>
    void save(current.rows.map((r, j) => (j === i ? row : r)), sync)

  const doneCount = current.rows.filter((r) => r.done_at !== null).length
  const ids = [...new Set(current.rows.map((r) => r.exercise_id))]

  return (
    <Card id="seans" title={`Seans ${day.label ?? ''}`} collapsible defaultOpen
      summary={`${doneCount}/${current.rows.length} set`}>
      <div className="space-y-4">
        {ids.map((exId) => (
          <div key={exId}>
            <p className="mb-1 text-sm text-ink-dim">{find(exId)?.name ?? exId}</p>
            {current.rows.map((row, i) =>
              row.exercise_id !== exId ? null : (
                <div key={row.id} className="flex items-center gap-1 text-sm tabular-nums">
                  <span className="w-5 text-ink-faint">{row.set_no}</span>
                  <Step label="ağırlık azalt" onClick={() => update(i, bump(row, 'weight_kg', -1), row.done_at !== null)}>−</Step>
                  <span className="w-14 text-center">{row.weight_kg ?? '–'} kg</span>
                  <Step label="ağırlık artır" onClick={() => update(i, bump(row, 'weight_kg', 1), row.done_at !== null)}>+</Step>
                  <Step label="tekrar azalt" onClick={() => update(i, bump(row, 'reps', -1), row.done_at !== null)}>−</Step>
                  <span className="w-8 text-center">{row.reps ?? '–'}</span>
                  <Step label="tekrar artır" onClick={() => update(i, bump(row, 'reps', 1), row.done_at !== null)}>+</Step>
                  <button
                    type="button"
                    aria-label={row.done_at ? 'seti geri al' : 'set yapıldı'}
                    onClick={() => update(i, { ...row, done_at: row.done_at ? null : new Date().toISOString() }, true)}
                    className={`ml-auto min-h-11 min-w-11 rounded-field ${row.done_at ? 'bg-work text-bg' : 'bg-glass-inset text-ink-faint'}`}
                  >
                    ✓
                  </button>
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function Step({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick}
      className="min-h-11 w-8 rounded-field bg-glass-inset text-ink-dim active:bg-glass-strong">
      {children}
    </button>
  )
}
