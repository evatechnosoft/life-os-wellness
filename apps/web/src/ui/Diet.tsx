import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'

import { recentLeanMass } from '../lib/chat'
import { lastDates, toLocalDate } from '../lib/date'
import { db } from '../lib/db'
import { dietBreak, weeklyPoints } from '../lib/dietBreak'
import { dietBreakText, recoveryText } from '../lib/coachText'
import { buildLapseInput, recoveryPlan } from '../lib/lapse'
import { movingAverage } from '../lib/metrics'
import { proteinTarget } from '../lib/nutrition'
import { DEFAULT_GOALS, saveGoals, useGoals } from '../lib/settings'
import { Card } from './Field'

/** Uzman onerisi ayda bir kez: gosterildigi ay burada saklanir. */
const SUPPORT_KEY = 'diet_support_shown'
/** Mola basladiginda eski hedef buraya yazilir, donusu kullanici yapar. */
const BREAK_KEY = 'diet_break'

interface BreakState {
  started_on: string
  previous_loss_pct: number
}

/**
 * Telafi plani ve diyet molasi kartlari (PLAN-DIET S1/S5). Hesap burada degil:
 * `lapse.ts` ve `dietBreak.ts` karar verir, bu bilesen veriyi toplar ve gosterir.
 */
export function Diet({ date }: { date: string }) {
  const goals = useGoals()
  const month = date.slice(0, 7)

  const logs = useLiveQuery(() => db.daily_log.toArray(), []) ?? []
  const meals = useLiveQuery(() => db.meal.reverse().limit(200).toArray(), []) ?? []
  const supportShown = useLiveQuery(() => db.settings.get(SUPPORT_KEY), [])
  const breakRow = useLiveQuery(() => db.settings.get(BREAK_KEY), [])
  const onBreak = (breakRow?.value as BreakState | undefined) != null

  const week = lastDates(7, new Date(`${date}T12:00:00`))
  const weekLogs = logs.filter((l) => week.includes(l.date))
  const avgWeight = movingAverage(weekLogs.map((l) => l.weight_kg))
  const avgSteps = movingAverage(weekLogs.map((l) => l.steps))
  const lean = useLiveQuery(() => recentLeanMass(date), [date]) ?? null
  const target = proteinTarget(avgWeight, goals, lean)

  const now = new Date()
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const weekday = new Date(`${date}T12:00:00`).getDay()

  const plan = recoveryPlan(
    buildLapseInput({
      date,
      logs,
      meals,
      protein_target_g: target?.recommended_g ?? goals.protein_g,
      avg_steps: avgSteps == null ? null : Math.round(avgSteps),
      support_shown: (supportShown?.value as string | undefined) === month,
      free_meal_planned: weekday === (goals.free_meal_day ?? DEFAULT_GOALS.free_meal_day),
      now: date === toLocalDate(now) ? clock : '23:59',
    }),
  )

  const suggestion = dietBreak(weeklyPoints(logs, goals, date), { on_break: onBreak })

  // Uzman onerisi ayda bir kez gorunur: gorundugu ay isaretlenir. Yazma render
  // sirasinda degil efektte, yoksa ayni render iki kez kosunca iki kez yazar.
  const showsSupport = plan?.refer_support === true
  useEffect(() => {
    if (showsSupport) void db.settings.put({ key: SUPPORT_KEY, value: month })
  }, [showsSupport, month])

  const startBreak = async () => {
    await db.settings.put({
      key: BREAK_KEY,
      value: { started_on: date, previous_loss_pct: goals.weekly_loss_pct } satisfies BreakState,
    })
    await saveGoals({ ...goals, weekly_loss_pct: 0 })
  }

  const endBreak = async () => {
    const state = breakRow?.value as BreakState | undefined
    await saveGoals({ ...goals, weekly_loss_pct: state?.previous_loss_pct ?? 0.7 })
    await db.settings.delete(BREAK_KEY)
  }

  if (!plan && !suggestion && !onBreak) return null

  return (
    <>
      {plan && (
        <Card title="Telafi">
          <p className="text-sm text-ink-dim">{recoveryText(plan)}</p>
        </Card>
      )}

      {suggestion && (
        <Card title="Diyet molası">
          <p className="text-sm text-ink-dim">{dietBreakText(suggestion)}</p>
          <button
            type="button"
            onClick={() => void startBreak()}
            className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm"
          >
            {suggestion.days} gün bakımda kal
          </button>
        </Card>
      )}

      {onBreak && (
        <Card title="Diyet molası">
          <p className="text-sm text-ink-dim">
            Moladasın: kayıp hedefi 0, protein ve antrenman aynı. Hazır olduğunda eski hedefe dön.
          </p>
          <button
            type="button"
            onClick={() => void endBreak()}
            className="mt-3 w-full rounded-field bg-glass-strong py-3 text-sm"
          >
            Molayı bitir
          </button>
        </Card>
      )}
    </>
  )
}
