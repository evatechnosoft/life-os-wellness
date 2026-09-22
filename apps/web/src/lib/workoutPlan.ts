import { useLiveQuery } from 'dexie-react-hooks'

import { api } from './api'
import { db } from './db'
import { hasServer, queueWorkoutPlan } from './store'

/** Gun tipi. Program (docs/PROGRAM-2026-09.md S5) uc tip taniyor. */
export type DayType = 'lift' | 'swim' | 'rest'

export type PlanExercise = { id: string; sets?: number; slot?: string | null }

export type PlanDay = {
  weekday: number
  day_type: DayType
  system?: string | null
  label?: string | null
  exercises?: PlanExercise[]
}

/** weekday = JS getDay: 0 pazar. training_split ve db/008 ile ayni sayilar. */
export type WorkoutPlan = Record<number, PlanDay>

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  lift: 'Direnç',
  swim: 'Yüzme',
  rest: 'Yürüyüş',
}

/** Gun tipi -> workout.type. "Bitir" ve dean-pt skill'i ayni tabloyu kullanir. */
export const DAY_TYPE_WORKOUT: Record<DayType, 'resistance' | 'cardio' | 'walk'> = {
  lift: 'resistance',
  swim: 'cardio',
  rest: 'walk',
}

export function useWorkoutPlan(): WorkoutPlan {
  const stored = useLiveQuery(() => db.settings.get('workout_plan'), [])
  return (stored?.value as WorkoutPlan | undefined) ?? {}
}

/** Tek gunu yazar; gonderilmeyen alana sunucu dokunmaz (routes.ts PUT /api/workout-plan). */
export async function saveDay(day: PlanDay): Promise<void> {
  const current = ((await db.settings.get('workout_plan'))?.value as WorkoutPlan | undefined) ?? {}
  const next = { ...current, [day.weekday]: { ...current[day.weekday], ...day } }
  await db.settings.put({ key: 'workout_plan', value: next })
  await queueWorkoutPlan([day])
}

export async function pullWorkoutPlan(): Promise<void> {
  if (!hasServer()) return
  const rows = await api<PlanDay[]>('/api/workout-plan')
  const plan: WorkoutPlan = {}
  for (const row of rows) plan[row.weekday] = row
  await db.settings.put({ key: 'workout_plan', value: plan })
}

/** O gunun plani. Plan kurulmamissa undefined - "Zar at" ekrani bunu gosterir. */
export function planFor(plan: WorkoutPlan, date: string): PlanDay | undefined {
  const [year, month, day] = date.split('-').map(Number)
  return plan[new Date(year!, month! - 1, day!).getDay()]
}
