import { Capacitor } from '@capacitor/core'
import { Health, type HealthPermission } from 'capacitor-health'

import { api } from './api'
import { lastDates, toLocalDate } from './date'
import { db, type Workout, type WorkoutType } from './db'
import type { WearableRecord } from './db'
import { hasServer, saveDaily, upsertWorkout } from './store'

export const SOURCE = 'health_connect'

/** Only what the watch actually measures. Every one of these is declared in AndroidManifest. */
const PERMISSIONS: HealthPermission[] = [
  'READ_STEPS',
  'READ_ACTIVE_CALORIES',
  'READ_WEIGHT',
  'READ_WORKOUTS',
]

/**
 * Only these two aggregate on both platforms. The plugin's queryAggregated accepts
 * 'steps' | 'active-calories' | 'mindfulness' - total calories and resting heart rate
 * have permission names but no daily read path, so they are not collected.
 */
const BUCKETS = [
  { metric: 'steps', dataType: 'steps' },
  { metric: 'active_kcal', dataType: 'active-calories' },
] as const

/** Deterministic uuid from a stable string, so re-syncing a workout overwrites its own row. */
async function stableId(seed: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed)))
  const hex = Array.from(digest.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('')
  const v = `${hex.slice(0, 12)}5${hex.slice(13, 16)}8${hex.slice(17, 32)}`
  return `${v.slice(0, 8)}-${v.slice(8, 12)}-${v.slice(12, 16)}-${v.slice(16, 20)}-${v.slice(20, 32)}`
}

/** Health Connect exercise names -> our four buckets. Anything unknown counts as cardio. */
function workoutType(name: string): WorkoutType {
  const n = name.toLowerCase()
  if (/strength|weight|resistance|gym/.test(n)) return 'resistance'
  if (/walk|hik/.test(n)) return 'walk'
  return 'cardio'
}

export interface HealthStatus {
  supported: boolean
  available: boolean
  granted: boolean
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

export async function healthStatus(): Promise<HealthStatus> {
  if (!isNative()) return { supported: false, available: false, granted: false }
  const { available } = await Health.isHealthAvailable()
  if (!available) return { supported: true, available: false, granted: false }
  const res = await Health.checkHealthPermissions({ permissions: PERMISSIONS })
  const granted = res.permissions.some((entry) => Object.values(entry).some(Boolean))
  return { supported: true, available: true, granted }
}

export async function requestHealthPermissions(): Promise<boolean> {
  if (!isNative()) return false
  const res = await Health.requestHealthPermissions({ permissions: PERMISSIONS })
  return res.permissions.some((entry) => Object.values(entry).some(Boolean))
}

export function openHealthConnect(): Promise<void> {
  return Health.openHealthConnectSettings()
}

export function installHealthConnect(): Promise<void> {
  return Health.showHealthConnectInPlayStore()
}

/** Local midnight of a YYYY-MM-DD, as the ISO instant the plugin expects. */
function dayBounds(dates: string[]): { startDate: string; endDate: string } {
  const first = dates[0]!.split('-').map(Number)
  const last = dates[dates.length - 1]!.split('-').map(Number)
  const start = new Date(first[0]!, first[1]! - 1, first[2]!, 0, 0, 0, 0)
  const end = new Date(last[0]!, last[1]! - 1, last[2]! + 1, 0, 0, 0, 0)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

/**
 * Pulls the last `days` days of watch data into IndexedDB and, when a server is
 * configured, forwards it. Safe to call repeatedly: every write is keyed by
 * date+metric, so a re-run refreshes today's partial numbers instead of stacking.
 */
export async function syncHealth(days = 7): Promise<number> {
  if (!isNative()) return 0
  const status = await healthStatus()
  if (!status.available || !status.granted) return 0

  const dates = lastDates(days)
  const { startDate, endDate } = dayBounds(dates)
  const records: WearableRecord[] = []
  const synced_at = new Date().toISOString()

  for (const { metric, dataType } of BUCKETS) {
    try {
      const res = await Health.queryAggregated({ startDate, endDate, dataType, bucket: 'day' })
      for (const row of res.aggregatedData) {
        if (row.value == null) continue
        const date = toLocalDate(new Date(row.startDate))
        records.push({ id: `${date}:${metric}`, date, metric, value: row.value, source: SOURCE, synced_at })
      }
    } catch {
      // A single unsupported metric must not abandon the whole sync.
    }
  }

  // Weight is a point measurement: keep the last reading of each day.
  try {
    const res = await Health.queryRecords({ startDate, endDate, dataType: 'weight' })
    const byDay = new Map<string, number>()
    for (const r of res.records) byDay.set(toLocalDate(new Date(r.startDate)), r.value)
    for (const [date, value] of byDay) {
      records.push({ id: `${date}:weight_kg`, date, metric: 'weight_kg', value, source: SOURCE, synced_at })
    }
  } catch {
    // no weight permission or no scale data
  }

  // Sessions the watch detected on its own. Written with a deterministic id so a
  // repeated sync updates the same row instead of duplicating the session.
  try {
    const res = await Health.queryWorkouts({ startDate, endDate, includeHeartRate: false, includeRoute: false, includeSteps: false })
    for (const w of res.workouts) {
      const start = new Date(w.startDate)
      const minutes = Math.round((new Date(w.endDate).getTime() - start.getTime()) / 60000)
      const id = await stableId(`${SOURCE}:${w.startDate}:${w.workoutType}`)
      const existing = await db.workout.get(id)
      const entry: Workout = {
        id,
        date: toLocalDate(start),
        type: workoutType(w.workoutType ?? ''),
        duration_min: minutes > 0 ? minutes : null,
        sets_total: null,
        muscle_groups: [],
        // Saat sureyi bilir, ne yapildigini bilmez: kullanici onaylayana kadar
        // "bu neydi?" kartinda bekler. Zaten onaylanmissa tekrar sorulmaz.
        needs_review: existing?.needs_review ?? true,
        notes: `saat: ${w.workoutType || 'antrenman'}${w.calories ? ` · ${Math.round(w.calories)} kcal` : ''}`,
      }
      await upsertWorkout(entry)
    }
  } catch {
    // no workout permission, or none recorded in the window
  }

  if (records.length === 0) return 0
  await db.wearable.bulkPut(records)

  // The watch wins for steps (SPEC 3), but the manual value is never deleted -
  // it stays in wearable/daily_log history, we only surface the automatic one.
  const today = toLocalDate()
  const todaySteps = records.find((r) => r.date === today && r.metric === 'steps')
  if (todaySteps) {
    // Saat gun icinde artan bir sayac; elle girilen daha buyuk bir deger varsa onu
    // ezmek veri kaybidir (telefon cepte degilken yurunen adim saatte yok).
    const manual = (await db.daily_log.get(today))?.steps ?? 0
    const watch = Math.round(todaySteps.value)
    if (watch > manual) await saveDaily(today, { steps: watch })
  }

  if (hasServer()) {
    try {
      await api('/api/wearable', {
        method: 'POST',
        body: JSON.stringify({
          records: records.map(({ date, source, metric, value }) => ({ date, source, metric, value })),
        }),
      })
    } catch {
      // Offline: the local copy is authoritative until the next successful sync.
    }
  }
  return records.length
  // Note: this source writes many days at once, so it batches directly rather than
  // going through recordMetrics (which covers the single-day sources).
}
