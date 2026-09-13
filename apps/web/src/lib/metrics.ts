import type { DailyLog, Meal, WearableRecord, Workout, WorkoutType } from './db'

/** Mean of the values present in the window. Missing days are skipped, not counted as zero. */
export function movingAverage(values: (number | null | undefined)[]): number | null {
  const present = values.filter((v): v is number => typeof v === 'number')
  if (present.length === 0) return null
  return present.reduce((sum, v) => sum + v, 0) / present.length
}

/**
 * Daily average of one wearable metric across the window. Days without a reading
 * are skipped: the watch not being worn is missing data, not a zero.
 */
export function dayAverage(records: WearableRecord[], metric: string): number | null {
  const values = records.filter((r) => r.metric === metric).map((r) => r.value)
  if (values.length === 0) return null
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

/**
 * MET degerleri (Compendium of Physical Activities): direnc antrenmani 5.0,
 * kardiyo 7.0, yuruyus 3.5. Kaldirilan agirlik MET'i degistirmez - yuk artinca
 * dinlenme de uzar - o yuzden hesaba girmez, ilerleme takibinde kullanilir.
 */
const MET: Record<WorkoutType, number> = { resistance: 5, cardio: 7, walk: 3.5, rest: 0 }

/**
 * Antrenmanin yaktigi tahmini kalori: MET x vucut agirligi x saat.
 * Sure veya kilo bilinmiyorsa tahmin yapilmaz - uydurma sayi gostermekten iyidir.
 */
export function estimateKcal(workout: Workout, bodyKg: number | null): number | null {
  if (!workout.duration_min || bodyKg == null) return null
  return Math.round(MET[workout.type] * bodyKg * (workout.duration_min / 60))
}

/**
 * En sik kaydedilen protein porsiyonlari. Tek kullanicida cesitlilik dusuk
 * oldugu icin gecmis, sabit bir listeden daha iyi tahmin verir; veri yoksa
 * makul varsayilanlar doner.
 */
export function frequentPortions(values: (number | null | undefined)[], fallback = [30, 35, 40]): number[] {
  const counts = new Map<number, number>()
  for (const value of values) {
    if (typeof value !== 'number' || value <= 0) continue
    const rounded = Math.round(value / 5) * 5
    counts.set(rounded, (counts.get(rounded) ?? 0) + 1)
  }
  if (counts.size === 0) return fallback
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).slice(0, 3).map(([g]) => g)
  return [...top, ...fallback.filter((f) => !top.includes(f))].slice(0, 3).sort((a, b) => a - b)
}

export interface FoodMemory {
  name: string
  protein_g: number
  kcal: number | null
  times: number
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length / 2
  // Ortanca, ortalamadan iyi: bir kere yanlis girilen 200 g butun hafizayi kaydirmasin.
  return sorted.length % 2 === 1
    ? sorted[Math.floor(mid)]!
    : Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 10) / 10
}

/**
 * "Tavuk" dendiginde her seferinde ayni degeri varsaymak icin gecmis ogunlerden
 * turetilen hafiza - ayri bir tablo yok, kayitlar zaten isim + protein tutuyor.
 * Yalniz tek parcali ogunden ogrenir: "tavuk, pilav" kaydinda proteinin hangi
 * parcaya ait oldugu bilinmiyor, tahmin etmek uydurmak olur.
 */
export function foodMemory(meals: Meal[], limit = 8): FoodMemory[] {
  const seen = new Map<string, { protein: number[]; kcal: number[] }>()
  for (const meal of meals) {
    const name = meal.note?.trim().toLowerCase()
    if (!name || name.includes(',') || typeof meal.protein_g !== 'number' || meal.protein_g <= 0) continue
    const entry = seen.get(name) ?? { protein: [], kcal: [] }
    entry.protein.push(meal.protein_g)
    if (typeof meal.kcal === 'number' && meal.kcal > 0) entry.kcal.push(meal.kcal)
    seen.set(name, entry)
  }
  return [...seen.entries()]
    .map(([name, { protein, kcal }]) => ({
      name,
      protein_g: median(protein),
      kcal: kcal.length > 0 ? median(kcal) : null,
      times: protein.length,
    }))
    .sort((a, b) => b.times - a.times || a.name.localeCompare(b.name))
    .slice(0, limit)
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
