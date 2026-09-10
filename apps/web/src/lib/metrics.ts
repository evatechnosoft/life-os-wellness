import type { DailyLog, Workout } from './db'

/** Mean of the values present in the window. Missing days are skipped, not counted as zero. */
export function movingAverage(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => typeof v === 'number')
  if (present.length === 0) return null
  return present.reduce((sum, v) => sum + v, 0) / present.length
}

/** Share of days in the window that reached the protein goal, 0-100. */
export function adherencePct(logs: DailyLog[], dates: string[], goalG: number): number {
  if (dates.length === 0) return 0
  const byDate = new Map(logs.map((l) => [l.date, l]))
  const hit = dates.filter((d) => (byDate.get(d)?.protein_g ?? 0) >= goalG).length
  return Math.round((hit / dates.length) * 100)
}

/**
 * Consecutive logged days ending at `today`, counting back.
 * Today not being logged yet does not break a streak that is otherwise intact.
 */
export function streak(loggedDates: Set<string>, orderedDates: string[]): number {
  let count = 0
  for (let i = orderedDates.length - 1; i >= 0; i -= 1) {
    const date = orderedDates[i]
    if (date === undefined) break
    if (loggedDates.has(date)) {
      count += 1
      continue
    }
    // Allow only the most recent day to be missing (the day is not over yet).
    if (i === orderedDates.length - 1 && count === 0) continue
    break
  }
  return count
}

export function setsByMuscle(workouts: Workout[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const w of workouts) {
    const sets = w.sets_total ?? 0
    if (sets === 0 || w.muscle_groups.length === 0) continue
    // Sets are logged per session; credit each worked group with the session's sets.
    for (const group of w.muscle_groups) {
      totals[group] = (totals[group] ?? 0) + sets
    }
  }
  return totals
}

export function weightDelta(logs: DailyLog[]): number | null {
  const weights = logs.filter((l) => typeof l.weight_kg === 'number')
  const first = weights[0]?.weight_kg
  const last = weights[weights.length - 1]?.weight_kg
  if (typeof first !== 'number' || typeof last !== 'number' || weights.length < 2) return null
  return Number((last - first).toFixed(2))
}
