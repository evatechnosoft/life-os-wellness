import type { PlanExercise } from './workoutPlan'

/** Program S5: 3 working sets is the default; the band keeps a tap from producing 0 or 20. */
const DEFAULT_SETS = 3
const MIN_SETS = 1
const MAX_SETS = 6

export function replaceExercise(list: PlanExercise[], index: number, id: string): PlanExercise[] {
  return list.map((ex, i) => (i === index ? { ...ex, id } : ex))
}

export function stepSets(list: PlanExercise[], index: number, delta: 1 | -1): PlanExercise[] {
  return list.map((ex, i) =>
    i === index ? { ...ex, sets: Math.min(MAX_SETS, Math.max(MIN_SETS, (ex.sets ?? DEFAULT_SETS) + delta)) } : ex,
  )
}

export function removeExercise(list: PlanExercise[], index: number): PlanExercise[] {
  return list.filter((_, i) => i !== index)
}

export function addExercise(list: PlanExercise[], id: string): PlanExercise[] {
  return [...list, { id, sets: DEFAULT_SETS, warmup: 0 }]
}
