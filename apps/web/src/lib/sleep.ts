import { registerPlugin } from '@capacitor/core'

import { api } from './api'
import { toLocalDate } from './date'
import { db, type WearableRecord } from './db'
import { hasServer } from './store'

export interface SleepSummary {
  monitoredMin: number
  snoreMin: number
  snoreEpisodes: number
  snoreWindowPct: number
  longestPauseSec: number
  noiseFloorDb: number
  windows: number
  /** Always true: the mic is duty-cycled, so durations are scaled estimates. */
  estimated: boolean
}

export interface SleepStatus {
  running: boolean
  microphoneGranted: boolean
  listenMs: number
  periodMs: number
  error?: string
  lastSummary?: SleepSummary
}

interface SleepPlugin {
  status(): Promise<SleepStatus>
  start(): Promise<{ running: boolean }>
  stop(): Promise<{ running: boolean; summary?: SleepSummary }>
}

/** Implemented in android/app/src/main/java/com/evaitec/wellness/SleepPlugin.kt. */
const Sleep = registerPlugin<SleepPlugin>('Sleep')

export const SOURCE_PHONE = 'phone_mic'

export function sleepStatus(): Promise<SleepStatus> {
  return Sleep.status()
}

export function startSleep(): Promise<{ running: boolean }> {
  return Sleep.start()
}

/**
 * Stops the monitor and files the night under the morning's date - you read the
 * result on the day you wake up, not the day you went to bed.
 */
export async function stopSleep(): Promise<SleepSummary | null> {
  const { summary } = await Sleep.stop()
  if (!summary) return null
  await storeSummary(summary)
  return summary
}

export async function storeSummary(summary: SleepSummary, date = toLocalDate()): Promise<void> {
  const synced_at = new Date().toISOString()
  const metrics: Record<string, number> = {
    sleep_monitored_min: summary.monitoredMin,
    snore_min: summary.snoreMin,
    snore_episodes: summary.snoreEpisodes,
    snore_window_pct: summary.snoreWindowPct,
    longest_pause_sec: summary.longestPauseSec,
  }
  const records: WearableRecord[] = Object.entries(metrics).map(([metric, value]) => ({
    id: `${date}:${metric}`,
    date,
    metric,
    value,
    source: SOURCE_PHONE,
    synced_at,
  }))
  await db.wearable.bulkPut(records)

  if (hasServer()) {
    try {
      await api('/api/wearable', {
        method: 'POST',
        body: JSON.stringify({
          records: records.map(({ date: d, source, metric, value }) => ({ date: d, source, metric, value })),
        }),
      })
    } catch {
      // Offline: the local copy stands until the next sync.
    }
  }
}
