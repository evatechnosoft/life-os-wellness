import { daysBetween } from './date'
import type { DailyLog } from './db'
import { weeklyLossKg, weightTrend, type WeightTrend } from './nutrition'
import type { Goals } from './settings'

/**
 * Diyet molasi (PLAN-DIET S5). Saf fonksiyon; haftalik trend serisini alir,
 * "1-2 hafta bakim kilosunda kal" onerisini uretip uretmeyecegine karar verir.
 *
 * Kanit SINIRLI (MATADOR, tek RCT, 51 obez erkek): mola bir aractir, mucize
 * degil. Eva "metabolizmani sifirlar" demez - cikti yalniz oneridir, kalori
 * hesabi icermez: bakim = protein ayni, kilo sabit, antrenman ayni.
 */

/** Bu kadar ardisik acik haftasi dolmadan mola onerilmez. */
const MIN_DEFICIT_WEEKS = 8

/** Son bu kadar hafta ustuste yavaslamis olmali. */
const STALLED_WEEKS = 3

/** Bel bu kadar dustuyse kilo durmus olsa da ilerleme var (recomposition). */
const WAIST_DROP_CM = 1

/** Onerilen mola suresi. Uygulamasi UI'da: hedef gecici 0, sonra eski hedefe donus. */
export const BREAK_DAYS = 14

export interface WeekPoint {
  /** O haftanin trend durumu (`nutrition.ts > weightTrend`). */
  status: WeightTrend['status']
  /** O haftanin kayip hedefi kg - 0 ise o hafta acikta degil, bakimda. */
  target_kg: number
  /** O haftanin bel olcusu; olculmediyse null. */
  waist_cm: number | null
}

export interface DietBreak {
  kind: 'diet_break'
  weeks_in_deficit: number
  days: typeof BREAK_DAYS
  action: 'suggest_maintenance'
  /** Bel olcusu var mi - yoksa karar yalniz kiloya dayanir, UI bunu soyler. */
  waist_known: boolean
  severity: 'info'
}

/** Seri sonundan geriye dogru kesintisiz acik haftasi sayisi. */
function deficitRun(weeks: WeekPoint[]): number {
  let count = 0
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    if ((weeks[i]?.target_kg ?? 0) <= 0) break
    count += 1
  }
  return count
}

/**
 * Bel dusuyor mu: acik serisi icindeki ilk ve son olcum karsilastirilir.
 * Iki olcum yoksa "dusuyor" denemez - veri yoklugu ilerleme kaniti degildir.
 */
function waistFalling(run: WeekPoint[]): { falling: boolean; known: boolean } {
  const measured = run.map((w) => w.waist_cm).filter((w): w is number => typeof w === 'number')
  if (measured.length < 2) return { falling: false, known: false }
  return { falling: measured[0]! - measured[measured.length - 1]! >= WAIST_DROP_CM, known: true }
}

/**
 * Mola onerisi. Zaten moladaysa ya da kosullardan biri tutmuyorsa null.
 * `weeks` kronolojik sirada, son eleman en yeni hafta.
 */
export function dietBreak(weeks: WeekPoint[], opts: { on_break?: boolean } = {}): DietBreak | null {
  if (opts.on_break) return null

  const weeks_in_deficit = deficitRun(weeks)
  if (weeks_in_deficit < MIN_DEFICIT_WEEKS) return null

  const recent = weeks.slice(-STALLED_WEEKS)
  if (recent.length < STALLED_WEEKS || !recent.every((w) => w.status === 'too_slow')) return null

  const waist = waistFalling(weeks.slice(-weeks_in_deficit))
  // Bel dusuyorsa kilo durmasi kayip degil, yeniden bicimlenmedir: mola gerekmez.
  if (waist.falling) return null

  return {
    kind: 'diet_break',
    weeks_in_deficit,
    days: BREAK_DAYS,
    action: 'suggest_maintenance',
    waist_known: waist.known,
    severity: 'info',
  }
}

/**
 * Gunluk kayitlari haftalik trend noktalarina cevirir: her nokta bir 7-gun
 * penceresinin ortalama kilosu, bir onceki pencereye gore durumu ve o haftanin
 * son bel olcusudur. Tartisi hic olmayan hafta atlanir - bos hafta "durgunluk"
 * degildir, olcum yoklugudur.
 */
export function weeklyPoints(logs: DailyLog[], goals: Goals, today: string, weeks = 12): WeekPoint[] {
  const buckets = new Map<number, { weights: number[]; waist: { date: string; cm: number }[] }>()
  for (const log of logs) {
    const back = daysBetween(log.date, today)
    if (back < 0 || back >= weeks * 7) continue
    const index = Math.floor(back / 7)
    const bucket = buckets.get(index) ?? { weights: [], waist: [] }
    if (typeof log.weight_kg === 'number') bucket.weights.push(log.weight_kg)
    if (typeof log.waist_cm === 'number') bucket.waist.push({ date: log.date, cm: log.waist_cm })
    buckets.set(index, bucket)
  }

  const points: WeekPoint[] = []
  let prevAvg: number | null = null
  // Eskiden yeniye: trend bir onceki haftaya gore hesaplanir.
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const bucket = buckets.get(index)
    if (!bucket || bucket.weights.length === 0) continue
    const avg = bucket.weights.reduce((sum, w) => sum + w, 0) / bucket.weights.length
    const trend = weightTrend(prevAvg, avg, goals)
    prevAvg = avg
    if (!trend) continue
    const lastWaist = [...bucket.waist].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
    points.push({ status: trend.status, target_kg: weeklyLossKg(goals, avg), waist_cm: lastWaist?.cm ?? null })
  }
  return points
}
