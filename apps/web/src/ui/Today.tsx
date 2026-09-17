import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { lastDates, toLocalDate } from '../lib/date'
import { db } from '../lib/db'
import { estimateKcal, frequentPortions } from '../lib/metrics'
import { pendingReminders, useReminderSettings } from '../lib/reminders'
import { addProtein, addWorkout, deleteWorkout, saveDaily, saveRetro } from '../lib/store'
import { Coach } from './Coach'
import { Diet } from './Diet'
import { Eva } from './Eva'
import { Card, NumberField } from './Field'
import { DayHeader } from './DayHeader'
import { Meals } from './Meals'
import { ReviewWorkout } from './ReviewWorkout'
import { Sleep } from './Sleep'
import { Watch } from './Watch'
import { draftToWorkout, emptyDraft, TYPES, WorkoutFields, type WorkoutDraft } from './WorkoutForm'


/** Gunluk sebze/baklagil porsiyon hedefi (PLAN-DIET S4). */
const VEG_TARGET = 5

export function Today({ date }: { date: string }) {
  const log = useLiveQuery(() => db.daily_log.get(date), [date])
  const workouts = useLiveQuery(() => db.workout.where('date').equals(date).toArray(), [date]) ?? []
  const retro = useLiveQuery(() => db.retro.get(date), [date])
  // Son iki haftanin ogunleri: hizli dugmeler gercek aliskanliktan turiyor.
  const recentMeals = useLiveQuery(() => db.meal.reverse().limit(60).toArray(), []) ?? []
  // Saatten gelen protein yalniz bilgi: manuel toplami ezmez, yaninda durur.
  const watchProtein = useLiveQuery(() => db.wearable.get(`${date}:protein_g`), [date])
  const [draft, setDraft] = useState<WorkoutDraft>(emptyDraft)
  // Bel haftada bir sorulur: bu hafta olculduyse hatirlatma cikmaz.
  const week = lastDates(7)
  const weekLogs =
    useLiveQuery(() => db.daily_log.where('date').between(week[0]!, week[6]!, true, true).toArray(), [date]) ?? []

  const done = workouts.filter((w) => !w.needs_review)
  const pulses = frequentPortions(recentMeals.map((m) => m.protein_g))
  const protein = log?.protein_g ?? 0
  const now = new Date()
  const eveningFirst = now.getHours() >= 20
  // Hatirlatma yalniz bugun icin: gecmis bir gune bakarken "tartilmadin" demek anlamsiz.
  const reminders = useReminderSettings()
  const due = date === toLocalDate(now)
    ? pendingReminders({
        log,
        retro,
        now: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        settings: reminders,
        weekday: now.getDay(),
        waist_logged_this_week: weekLogs.some((l) => l.waist_cm != null),
      })
    : []

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
    <div className="space-y-3">
      <DayHeader date={date} />

      {due.length > 0 && (
        <ul className="rounded-field bg-glass-inset p-3 text-sm">
          {due.map((r) => (
            <li key={r.id} className="flex gap-2 py-0.5">
              <span aria-hidden className="text-a1">•</span>
              <span>
                <span className="text-ink-dim">{r.title}</span>
                <span className="text-ink-faint"> — {r.body}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Coach date={date} />

      <Diet date={date} />

      <Eva compact />

      {eveningFirst && retroCard}

      <Card title="Protein ekle">
        <div className="flex gap-2">
          {pulses.map((g) => (
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
            onClick={() => void addProtein(date, -pulses[0]!)}
            disabled={protein === 0}
            className="rounded-field bg-glass-strong px-4 text-sm text-ink-dim disabled:opacity-40"
          >
            −
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-ink-faint">
            Sebze/baklagil {log?.veg_servings ?? 0}/{VEG_TARGET}
          </span>
          <button
            type="button"
            onClick={() => void saveDaily(date, { veg_servings: (log?.veg_servings ?? 0) + 1 })}
            className="ml-auto rounded-field bg-glass-strong px-4 py-2 text-sm"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => void saveDaily(date, { veg_servings: Math.max(0, (log?.veg_servings ?? 0) - 1) })}
            disabled={(log?.veg_servings ?? 0) === 0}
            className="rounded-field bg-glass-strong px-4 py-2 text-sm text-ink-dim disabled:opacity-40"
          >
            −
          </button>
        </div>

        {watchProtein && (
          <p className="mt-3 text-xs text-ink-faint">
            Saatten {Math.round(watchProtein.value).toLocaleString('tr-TR')} g
          </p>
        )}
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
        <NumberField
          label="Bel (haftada bir)"
          unit="cm"
          step={0.5}
          value={log?.waist_cm}
          onCommit={(v) => void saveDaily(date, { waist_cm: v })}
        />
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
                    {w.reps_total ? ` · ${w.reps_total} tekrar` : ''}
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
