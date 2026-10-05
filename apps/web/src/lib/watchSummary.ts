import { Capacitor, registerPlugin } from '@capacitor/core'

import { lastDates, toLocalDate } from './date'
import { db, type DailyLog, type Meal, type Workout } from './db'
import { find } from './exercises'
import { kcalDayAverage, weightDelta } from './metrics'
import { DEFAULT_GOALS, type Goals } from './settings'
import { type PlanDay, type WorkoutPlan } from './workoutPlan'

/**
 * Telefon -> saat ozeti (docs/PLAN-WEAR.md S-next, Ozet ekrani). Saat tarafi
 * wear/.../Summary.kt ayni alanlari okur; eksik alan null kalir, saat o satiri gizler.
 */
export interface WatchSummary {
  date: string
  protein_g: number | null
  protein_goal: number
  kcal_avg7: number | null
  kcal_max: number | null
  weight_delta7: number | null
  steps: number | null
  plan: { id: string; name: string; sets: number; last_kg: number | null }[]
}

export interface WatchSummaryInput {
  today: string
  mealsToday: Meal[]
  /** Son 7 tam gun (bugun haric) - Week.tsx ile ayni pencere. */
  kcalMeals: Meal[]
  /** Son 7 gunun gunlugu, tarih sirali. */
  logs7: DailyLog[]
  goals: Goals
  planDay: PlanDay | undefined
  /** Son kg icin: tarih sirali seanslar (eski -> yeni). */
  workouts: Workout[]
}

export function buildWatchSummary(input: WatchSummaryInput): WatchSummary {
  const protein = input.mealsToday.reduce((s, m) => s + (m.protein_g ?? 0), 0)
  const today = input.logs7.find((l) => l.date === input.today)
  const exercises = input.planDay?.day_type === 'lift' ? (input.planDay.exercises ?? []) : []
  return {
    date: input.today,
    protein_g: input.mealsToday.length === 0 ? null : protein,
    protein_goal: input.goals.protein_g,
    kcal_avg7: kcalDayAverage(input.kcalMeals),
    kcal_max: input.goals.kcal_week_max ?? null,
    weight_delta7: weightDelta(input.logs7),
    steps: today?.steps ?? null,
    plan: exercises.map((e) => ({
      id: e.id,
      name: find(e.id)?.name ?? e.id,
      sets: e.sets ?? 2,
      last_kg: lastWeight(input.workouts, e.id),
    })),
  }
}

/** O hareketin en son yapilan setindeki kg; hic yoksa null. */
export function lastWeight(workouts: Workout[], exerciseId: string): number | null {
  for (let i = workouts.length - 1; i >= 0; i--) {
    const sets = (workouts[i]!.sets ?? []).filter((s) => s.exercise_id === exerciseId && typeof s.weight_kg === 'number')
    if (sets.length > 0) return sets[sets.length - 1]!.weight_kg
  }
  return null
}

const WearBridge = registerPlugin<{ pushSummary(opts: { json: string }): Promise<void> }>('WearBridge')

/** pullRange sonunda cagrilir: saat her senkronda guncel ozeti gorur. Web'de is yok. */
export async function pushWatchSummary(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const today = toLocalDate()
  const week = lastDates(7)
  const kcalDates = lastDates(8).slice(0, -1)
  const planStored = (await db.settings.get('workout_plan'))?.value as WorkoutPlan | undefined
  const goalsStored = (await db.settings.get('goals'))?.value as Partial<Goals> | undefined
  const [year, month, day] = today.split('-').map(Number)
  const weekday = new Date(year!, month! - 1, day!).getDay()
  const summary = buildWatchSummary({
    today,
    mealsToday: await db.meal.where('date').equals(today).toArray(),
    kcalMeals: await db.meal.where('date').between(kcalDates[0]!, kcalDates[kcalDates.length - 1]!, true, true).toArray(),
    logs7: await db.daily_log.where('date').between(week[0]!, today, true, true).sortBy('date'),
    goals: { ...DEFAULT_GOALS, ...(goalsStored ?? {}) },
    planDay: planStored?.[weekday],
    workouts: await db.workout.where('date').between(lastDates(60)[0]!, today, true, true).sortBy('date'),
  })
  await WearBridge.pushSummary({ json: JSON.stringify(summary) })
}
