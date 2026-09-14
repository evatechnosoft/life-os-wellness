import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

import { recordMetrics } from './store'

/** Saat sadece yeni bir kaynak: yeni tablo/sema yok, recordMetrics ayni yoldan yaziyor. */
export const SOURCE_WATCH = 'watch_app'

export interface WatchRecord {
  /** YYYY-MM-DD, saatin yerel takvimi - gun saatte turetiliyor, UTC kaymasi yok. */
  date: string
  metrics: Record<string, number>
}

interface WearBridgePlugin {
  drain(): Promise<{ records: string[] }>
  status(): Promise<{ connectedNodes: number; error?: string }>
  pushApk(): Promise<{ ok: boolean; status: string }>
  addListener(
    event: 'apkPush',
    listener: (data: { status: string }) => void,
  ): Promise<PluginListenerHandle>
}

/** android/app/src/main/java/com/evaitec/wellness/WearBridgePlugin.kt. */
const WearBridge = registerPlugin<WearBridgePlugin>('WearBridge')

const isNative = (): boolean => Capacitor.isNativePlatform()

const DATE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Kuyruktaki ham JSON satirlarini gune gore toplar. Saatten gelen her sey supheli:
 * bozuk satir, bozuk tarih ya da sayi olmayan olcum sessizce atilir - yarim bir kayit
 * yuzunden gunun tamami kaybolmasin.
 *
 * Ayni metrik iki kez geldiyse **en yeni ts kazanir**; Data Layer teslim sirasini
 * garanti etmiyor, dolayisiyla "son gelen" ile "en yeni" ayni sey degil.
 */
export function parseWatchRecords(raw: string[]): WatchRecord[] {
  const byDate = new Map<string, Map<string, { value: number; ts: number }>>()
  for (const entry of raw) {
    const parsed: unknown = ((): unknown => {
      try {
        return JSON.parse(entry)
      } catch {
        return null
      }
    })()
    if (typeof parsed !== 'object' || parsed === null) continue
    const { date, metrics, ts } = parsed as { date?: unknown; metrics?: unknown; ts?: unknown }
    if (typeof date !== 'string' || !DATE.test(date)) continue
    if (typeof metrics !== 'string') continue
    const at = typeof ts === 'number' ? ts : 0
    let body: unknown
    try {
      body = JSON.parse(metrics)
    } catch {
      continue
    }
    if (typeof body !== 'object' || body === null) continue
    const day = byDate.get(date) ?? new Map<string, { value: number; ts: number }>()
    byDate.set(date, day)
    for (const [metric, value] of Object.entries(body as Record<string, unknown>)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
      const seen = day.get(metric)
      if (seen && seen.ts > at) continue
      day.set(metric, { value, ts: at })
    }
  }
  return [...byDate.entries()]
    .map(([date, day]) => ({
      date,
      metrics: Object.fromEntries([...day.entries()].map(([metric, { value }]) => [metric, value])),
    }))
    .filter((record) => Object.keys(record.metrics).length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Kuyrugu bosaltir ve gunluk kayitlara yazar. Yazilan gun sayisini doner. */
export async function drainWatch(): Promise<number> {
  if (!isNative()) return 0
  const { records } = await WearBridge.drain()
  const days = parseWatchRecords(records)
  for (const day of days) await recordMetrics(SOURCE_WATCH, day.date, day.metrics)
  return days.length
}

/**
 * Saat uygulamasini telefondan kurar: telefon APK'yi yayindan indirir, saate Data Layer
 * kanaliyla akitir, kurulumu saat onaylatir. Saatin kendi interneti Bluetooth vekilinden
 * gectigi icin indirmeyi telefon yapiyor.
 *
 * Ilk kurulum bununla yapilamaz - saatte dinleyen bir uygulama yoksa gonderilecek kanal
 * da yok; o tek sefer kablosuz ADB ile.
 */
export async function pushWatchApp(): Promise<{ ok: boolean; status: string }> {
  if (!isNative()) return { ok: false, status: 'Yalnız Android uygulamasında çalışır' }
  return WearBridge.pushApk()
}

/** Gonderimin ara durumlari (indiriliyor / gonderiliyor). Web'de dinleyici yok. */
export async function onWatchAppPush(
  listener: (status: string) => void,
): Promise<PluginListenerHandle | null> {
  if (!isNative()) return null
  return WearBridge.addListener('apkPush', ({ status }) => listener(status))
}

/** Eslesmis saat var mi - "gonderdim ama gelmedi" ile "saat yok"u ayirmak icin. */
export async function watchStatus(): Promise<{ connectedNodes: number; error?: string }> {
  if (!isNative()) return { connectedNodes: 0 }
  return WearBridge.status()
}
