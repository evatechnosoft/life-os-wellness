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
  version(): Promise<{ versionName: string; versionCode: number }>
  checkUpdate(): Promise<PhoneUpdate>
  installUpdate(): Promise<{ status: string }>
  addListener(
    event: 'apkPush' | 'phoneUpdate',
    listener: (data: { status: string }) => void,
  ): Promise<PluginListenerHandle>
}

/** Telefonun kendi guncelleme durumu; karari native taraf (evaitecOTA) veriyor. */
export interface PhoneUpdate {
  state: 'available' | 'upToDate' | 'blocked'
  versionName?: string
  reason?: string
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

/** Kurulu APK surumu. Web'de APK yok; JS'e sabit yazmamak icin native'den okunuyor. */
export async function appVersion(): Promise<string> {
  if (!isNative()) return ''
  const { versionName, versionCode } = await WearBridge.version()
  return `${versionName} (${versionCode})`
}

const CACHE_KEY = 'phone_update'
/** En fazla gunde bir sorulur: guncelleme kontrolu kullaniciyi rahatsiz etmemeli. */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

/**
 * Acilista bir kez, sonra en fazla gunde bir manifeste bakar; gun dolmadiysa son cevabi
 * doner, ag isi yapilmaz. Sonuc onbellege yaziliyor cunku acilistaki kontrolu ile Ayarlar
 * ekrani ayni cevabi gormeli - ikisi ayri ayri sormasin.
 */
export async function autoCheckPhoneUpdate(): Promise<PhoneUpdate | null> {
  if (!isNative()) return null
  // Onbellek kurulu surume bagli: 0.37.0 kurulduktan sonra dunku "0.37.0 hazir"
  // cevabi bir gun daha bant olarak kaliyordu, Guncelle "zaten guncel" diyordu.
  const installed = (await WearBridge.version()).versionName
  const cached = readCache()
  if (cached && cached.installed === installed && Date.now() - cached.at < CHECK_INTERVAL_MS) return cached.result
  const result = await checkPhoneUpdate()
  // Blocked = ag yok / manifest bozuk. Onbellek yalniz gercek bir cevapta tazelenir,
  // yoksa ucakta acilan uygulama bir gun boyunca guncellemeyi kacirir.
  if (result.state !== 'blocked') {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), installed, result }))
  }
  return result
}

function readCache(): { at: number; installed?: string; result: PhoneUpdate } | null {
  const raw = localStorage.getItem(CACHE_KEY)
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { at, installed, result } = parsed as { at?: unknown; installed?: unknown; result?: unknown }
    if (typeof at !== 'number' || typeof result !== 'object' || result === null) return null
    return { at, installed: typeof installed === 'string' ? installed : undefined, result: result as PhoneUpdate }
  } catch {
    return null
  }
}

/** Kullanici istedi ya da gun doldu: manifeste bak. */
export async function checkPhoneUpdate(): Promise<PhoneUpdate> {
  if (!isNative()) return { state: 'blocked', reason: 'Yalnız Android uygulamasında çalışır' }
  return WearBridge.checkUpdate()
}

/** Indir + kurulum istemini ac. Yalniz kullanici onayiyla cagrilir. */
export async function installPhoneUpdate(): Promise<{ status: string }> {
  if (!isNative()) return { status: 'Yalnız Android uygulamasında çalışır' }
  return WearBridge.installUpdate()
}

/** Indirmenin ara durumlari (yuzde). Saatteki `apkPush` ile ayni desen. */
export async function onPhoneUpdate(
  listener: (status: string) => void,
): Promise<PluginListenerHandle | null> {
  if (!isNative()) return null
  return WearBridge.addListener('phoneUpdate', ({ status }) => listener(status))
}
