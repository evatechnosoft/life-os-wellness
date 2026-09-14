import { registerPlugin } from '@capacitor/core'

import { toLocalDate } from './date'
import { isNative } from './health'
import { recordMetrics } from './store'

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
