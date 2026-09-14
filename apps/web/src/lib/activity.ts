import { Capacitor, registerPlugin } from '@capacitor/core'

import { toLocalDate } from './date'
import type { WorkoutType } from './db'
import { recordMetrics } from './store'

/** health.ts'deki isNative ile ayni kontrol; oradan almak iki modulu birbirine baglardi. */
const isNative = (): boolean => Capacitor.isNativePlatform()

/**
 * Telefonun kendi bildigi hareket durumu. Bu bes sinifin disinda bir sey
 * vaat edilmiyor: cepteki telefon bench/squat ayirt edemez, tekrar sayamaz.
 */
export type ActivityType = 'walking' | 'running' | 'cycling' | 'in_vehicle' | 'still'

export interface ActivityInterval {
  type: ActivityType
  startMs: number
  /** null ise aralik hala aciktir - EXIT gecisi gelmedi. */
  endMs: number | null
}

export interface ActivityStatus {
  granted: boolean
  subscribed: boolean
  events: number
}

interface ActivityPlugin {
  status(): Promise<ActivityStatus>
  start(): Promise<{ granted: boolean; subscribed: boolean }>
  stop(): Promise<{ subscribed: boolean }>
  intervals(): Promise<{ intervals: ActivityInterval[] }>
}

/** Implemented in android/app/src/main/java/com/evaitec/wellness/ActivityPlugin.kt. */
const Activity = registerPlugin<ActivityPlugin>('Activity')

export const SOURCE_PHONE_ACTIVITY = 'phone_activity'

/** Mevcut metrik adlandirmasiyla ayni kalip: <sey>_min. Sema degisikligi yok. */
export const ACTIVITY_METRIC: Record<ActivityType, string> = {
  walking: 'phone_walking_min',
  running: 'phone_running_min',
  cycling: 'phone_cycling_min',
  in_vehicle: 'phone_in_vehicle_min',
  still: 'phone_still_min',
}

const OFF: ActivityStatus = { granted: false, subscribed: false, events: 0 }

/**
 * Araliklari gune ve metrige gore dakikaya toplar. Gece yarisini asan aralik
 * basladigi gune yazilir - gunu ikiye bolmek bu veriden beklenen dogruluga
 * gore fazla is.
 */
export function dailyMinutes(
  intervals: ActivityInterval[],
  now = Date.now(),
): Record<string, Record<string, number>> {
  const days: Record<string, Record<string, number>> = {}
  for (const interval of intervals) {
    const end = interval.endMs ?? now
    const ms = end - interval.startMs
    if (!(ms > 0)) continue // bozuk veya gelecege dusen aralik
    const metric = ACTIVITY_METRIC[interval.type]
    if (!metric) continue
    const date = toLocalDate(new Date(interval.startMs))
    const day = (days[date] ??= {})
    day[metric] = (day[metric] ?? 0) + ms / 60_000
  }
  for (const day of Object.values(days)) {
    for (const metric of Object.keys(day)) day[metric] = Math.round(day[metric]!)
  }
  return days
}

export async function activityStatus(): Promise<ActivityStatus> {
  if (!isNative()) return OFF
  try {
    return await Activity.status()
  } catch {
    return OFF
  }
}

/**
 * Izin ister ve gecis dinlemesini acar. UI'daki "Izin ver" dugmesine baglanir;
 * izin verilmezse granted:false doner, hata gostermez.
 */
export async function enableActivity(): Promise<ActivityStatus> {
  if (!isNative()) return OFF
  try {
    const result = await Activity.start()
    return { ...result, events: 0 }
  } catch {
    return OFF
  }
}

export async function disableActivity(): Promise<void> {
  if (!isNative()) return
  try {
    await Activity.stop()
  } catch {
    // Play Services yoksa zaten dinlemiyorduk.
  }
}

/** Biriken gecisleri gunluk dakikalara cevirip yazar. Idempotent. */
export async function syncActivity(now = Date.now()): Promise<Record<string, Record<string, number>>> {
  if (!isNative()) return {}
  let intervals: ActivityInterval[]
  try {
    ;({ intervals } = await Activity.intervals())
  } catch {
    return {}
  }
  const days = dailyMinutes(intervals, now)
  for (const [date, metrics] of Object.entries(days)) {
    await recordMetrics(SOURCE_PHONE_ACTIVITY, date, metrics)
  }
  return days
}

/** Ham araliklar - nabiz penceresiyle eslestirmek icin health.ts okur. */
export async function activityIntervals(): Promise<ActivityInterval[]> {
  if (!isNative()) return []
  try {
    const { intervals } = await Activity.intervals()
    return intervals
  } catch {
    return []
  }
}

export interface TimeRange {
  startMs: number
  endMs: number
}

/**
 * Pencerenin en az bu kadari hareketle ortusmezse tip cikarilmaz - soru sorulur.
 * Yarim: Transition API gecisi gecikmeli bildirir (ENTER kostuktan bir kac dakika
 * sonra duser), yani tam ortusme hicbir zaman beklenmemeli; ama pencerenin
 * cogunlugunu aciklamayan bir hareket de o nabzi acikliyor sayilmaz.
 */
export const MIN_OVERLAP_RATIO = 0.5

/**
 * Gunde en fazla kac "bu neydi?" sorusu uretilir. Telefonun hareketinden tipi
 * cikarilan pencereler bu siniri **tuketmez** - onlar soru degil, onay.
 */
export const MAX_HR_QUESTIONS_PER_DAY = 2

/**
 * Hareket sinifi -> antrenman kovasi. `type: null` "bu antrenman degil" demek:
 * aracta yukselen nabiz trafik/stres, kayit uretmek veri uydurmaktir. `still`
 * hic esleme uretmez: hareketsiz gecen yuksek nabiz pekala agirlik seansi
 * olabilir (telefon cepte durur), orada bugunku davranis korunur - sorulur.
 */
const WORKOUT_OF: Partial<Record<ActivityType, { type: WorkoutType | null; label: string }>> = {
  running: { type: 'cardio', label: 'koşu' },
  cycling: { type: 'cardio', label: 'bisiklet' },
  walking: { type: 'walk', label: 'yürüyüş' },
  in_vehicle: { type: null, label: 'araçta' },
}

/** Esitlikte kazanan sira: daha ozgul/yogun hareket once. */
const PRIORITY: ActivityType[] = ['running', 'cycling', 'walking', 'in_vehicle']

export interface ActivityMatch {
  activity: ActivityType
  /** null ise pencere antrenman degildir: ne kayit uretilir ne soru sorulur. */
  type: WorkoutType | null
  label: string
  overlapMin: number
}

/**
 * Yuksek nabiz penceresini telefonun hareket araliklariyla esler. Saf fonksiyon.
 *
 * Birden cok tip ortusurse **toplam ortusmesi en uzun olan** kazanir: gecis
 * verisinde yogunluk yok, olculebilen tek sey sure. Hicbiri esigi gecmezse null
 * doner - yani hareket verisi yoksa ya da belirsizse bugunku davranis (soru) surer.
 */
export function matchActivity(
  window: TimeRange,
  intervals: ActivityInterval[],
  now = Date.now(),
): ActivityMatch | null {
  const span = window.endMs - window.startMs
  if (!(span > 0)) return null

  const overlaps = new Map<ActivityType, number>()
  for (const interval of intervals) {
    if (!WORKOUT_OF[interval.type]) continue
    const end = interval.endMs ?? now
    const ms = Math.min(end, window.endMs) - Math.max(interval.startMs, window.startMs)
    if (ms <= 0) continue
    overlaps.set(interval.type, (overlaps.get(interval.type) ?? 0) + ms)
  }

  let best: ActivityType | null = null
  for (const [type, ms] of overlaps) {
    const bestMs = best ? overlaps.get(best)! : 0
    if (ms > bestMs || (ms === bestMs && PRIORITY.indexOf(type) < PRIORITY.indexOf(best!))) best = type
  }
  if (!best) return null
  const ms = overlaps.get(best)!
  if (ms / span < MIN_OVERLAP_RATIO) return null
  const mapped = WORKOUT_OF[best]!
  return { activity: best, type: mapped.type, label: mapped.label, overlapMin: Math.round(ms / 60_000) }
}

/**
 * Sirali pencereler icin karar: hangisi tamamen duser, hangisi soru, hangisi onay.
 * Gunluk soru siniri yalniz tipi cikarilamayanlari sayar; aractakiler hic gorunmez.
 * Listede olmayan pencere kullaniciya hic sorulmaz.
 */
export function planHrWindows<T extends TimeRange & { date: string }>(
  windows: T[],
  intervals: ActivityInterval[],
  now = Date.now(),
  limit = MAX_HR_QUESTIONS_PER_DAY,
): { window: T; match: ActivityMatch | null }[] {
  const asked = new Map<string, number>()
  const out: { window: T; match: ActivityMatch | null }[] = []
  for (const win of windows) {
    const match = matchActivity(win, intervals, now)
    if (match?.type === null) continue // aractaki nabiz antrenman degil
    if (!match) {
      if ((asked.get(win.date) ?? 0) >= limit) continue
      asked.set(win.date, (asked.get(win.date) ?? 0) + 1)
    }
    out.push({ window: win, match })
  }
  return out
}
