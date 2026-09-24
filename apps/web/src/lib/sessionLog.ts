import type { ExerciseSet, Workout } from './db'
import { find, regionsFor } from './exercises'
import type { PlanExercise } from './workoutPlan'

/**
 * Salonda set kaydi: "gecen seferki gibi" tek dokunus (docs/PLAN-GERCEKCI.md P0.1).
 *
 * Uc direnc seansinda sets_total hep bos kaldi - tek toplam alanli form salonda
 * doldurulmuyor. Burada her set son seansin agirlik x tekrariyla hazir gelir;
 * kullanici yalniz yaptigini isaretler, sapma varsa +/- ile duzeltir. Saf katman:
 * ekran ve depo UI tarafinda.
 */

/** Ekrandaki bir set. done_at null = henuz yapilmadi, sunucuya gitmez. */
export type LogRow = ExerciseSet

const DEFAULT_SETS = 3
const WEIGHT_STEP = 2.5

/** Hareketin `before` gununden onceki en son seanstaki setleri, set_no sirasiyla. */
function lastSets(workouts: Workout[], exerciseId: string, before: string): ExerciseSet[] {
  let best: { date: string; sets: ExerciseSet[] } | null = null
  for (const w of workouts) {
    if (w.date >= before) continue
    const sets = (w.sets ?? []).filter((s) => s.exercise_id === exerciseId)
    if (sets.length > 0 && (best === null || w.date > best.date)) best = { date: w.date, sets }
  }
  return (best?.sets ?? []).slice().sort((a, b) => a.set_no - b.set_no)
}

export function prefill(
  plan: PlanExercise[],
  workouts: Workout[],
  date: string,
  newId: () => string,
): LogRow[] {
  return plan.flatMap((ex) => {
    const last = lastSets(workouts, ex.id, date)
    return Array.from({ length: ex.sets ?? DEFAULT_SETS }, (_, i) => {
      // Gecen sefer daha az set yapildiysa fazlasi son setin degerini alir.
      const ref = last[i] ?? last[last.length - 1]
      return {
        id: newId(),
        exercise_id: ex.id,
        set_no: i + 1,
        weight_kg: ref?.weight_kg ?? null,
        reps: ref?.reps ?? null,
        done_at: null,
      }
    })
  })
}

export function bump(row: LogRow, field: 'weight_kg' | 'reps', dir: 1 | -1): LogRow {
  const step = field === 'weight_kg' ? WEIGHT_STEP : 1
  return { ...row, [field]: Math.max(0, (row[field] ?? 0) + dir * step) }
}

/** Katalog bolgesi -> BodyPicker grubu (metrics.setsByMuscle bu adlari sayar). */
const GROUP: Record<string, string> = {
  gogus: 'göğüs',
  sirt: 'sırt',
  bel: 'sırt',
  omuz: 'omuz',
  kol: 'kol',
  onkol: 'kol',
  karin: 'karın',
  onBacak: 'bacak',
  arkaBacak: 'bacak',
  kalca: 'bacak',
  baldir: 'bacak',
}

export function musclesFor(exerciseIds: string[]): string[] {
  const groups = new Set<string>()
  for (const id of exerciseIds) {
    const ex = find(id)
    if (ex === null) continue
    for (const region of regionsFor(ex).primary) {
      const group = GROUP[region]
      if (group !== undefined) groups.add(group)
    }
  }
  return [...groups]
}

/**
 * Yapilan setlerden seans kaydi. `base` saatin ayni gun buldugu direnc seansiysa
 * onun id/sure/notu korunur - ayni antrenman iki satir olmasin.
 */
export function buildWorkout(id: string, date: string, rows: LogRow[], base: Workout | undefined): Workout {
  const done = rows.filter((r) => r.done_at !== null)
  return {
    ...base,
    id,
    date,
    type: 'resistance',
    sets: done,
    sets_total: done.length,
    reps_total: done.reduce((sum, r) => sum + (r.reps ?? 0), 0),
    muscle_groups: musclesFor([...new Set(done.map((r) => r.exercise_id))]),
    needs_review: false,
  }
}
