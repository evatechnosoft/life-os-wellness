import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

import { coachTips, todayFocus } from '../lib/coach'
import { coachLines, todayText } from '../lib/coachText'
import { db } from '../lib/db'
import { lastDates } from '../lib/date'
import { movingAverage } from '../lib/metrics'
import { slotGaps, suggestFoods } from '../lib/nutrition'
import { useGoals } from '../lib/settings'
import { useSplit } from '../lib/split'
import { Card } from './Field'

/** Ekrani oneri coplugune cevirmemek icin ilk uc satir gorunur, kalani istege bagli. */
const VISIBLE = 3

/**
 * Kural motorlarinin (coach.ts + nutrition.ts) ciktisini tek kartta toplar.
 * Burada hesap yok: veri saf fonksiyonlardan gelir, bu bilesen yalniz siralar
 * ve gosterir.
 */
export function Coach({ date }: { date: string }) {
  const goals = useGoals()
  const split = useSplit()
  const [open, setOpen] = useState(false)

  // Ilerleme ve deload haftalardan uzun gecmis ister; hacim filtresini coachTips kendi yapar.
  const workouts = useLiveQuery(() => db.workout.toArray(), []) ?? []
  const todayMeals = useLiveQuery(() => db.meal.where('date').equals(date).toArray(), [date]) ?? []
  const week = lastDates(7)
  const logs =
    useLiveQuery(() => db.daily_log.where('date').between(week[0]!, week[6]!, true, true).toArray(), [date]) ?? []
  // Ogun gecmisi: oneri gecmiste gercekten yenmis yiyecekten turer.
  const meals = useLiveQuery(() => db.meal.reverse().limit(200).toArray(), []) ?? []

  const avgWeight = movingAverage(logs.map((l) => l.weight_kg))
  const now = new Date()
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const recentMeals = meals.filter((m) => m.date >= week[4]!)

  const today = todayFocus(split, workouts, date)
  const lines = coachLines(
    coachTips(workouts, goals, split, date),
    slotGaps(todayMeals, avgWeight, goals, clock).map((gap) => ({
      gap,
      foods: suggestFoods(meals, gap.slot, { recentMeals, limit: 2 }),
    })),
  )

  const shown = open ? lines : lines.slice(0, VISIBLE)

  return (
    <Card title="Koç">
      <p className="text-sm text-ink-dim">{todayText(today)}</p>

      {lines.length === 0 ? (
        <p className="mt-2 text-xs text-ink-faint">Bugün için önerim yok — plan yolunda görünüyor.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {shown.map((line) => (
            <li key={line.id} className="flex gap-2 text-sm">
              <span aria-hidden className={line.severity === 'warn' ? 'text-a2' : 'text-a1'}>
                •
              </span>
              <span className="text-ink-dim">{line.text}</span>
            </li>
          ))}
        </ul>
      )}

      {lines.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-2 min-h-11 text-xs text-ink-faint"
        >
          {open ? 'daha az' : `${lines.length - VISIBLE} öneri daha`}
        </button>
      )}
    </Card>
  )
}
