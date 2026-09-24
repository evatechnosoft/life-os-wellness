import { Capacitor, registerPlugin } from '@capacitor/core'
import { Health, type HealthPermission } from 'capacitor-health'

import { api, getApiBase, getToken } from './api'
import { lastDates, toLocalDate } from './date'
import { db, type Workout } from './db'
import type { WearableRecord } from './db'
import { activityIntervals, planHrWindows } from './activity'
import { detectedExercise, isAnswered, segmentMusclesOf } from './watchExercise'
import { dismissedWorkouts, hasServer, saveDaily, upsertWorkout } from './store'

export const SOURCE = 'health_connect'

export interface HealthExtraDay {
  date: string
  total_kcal?: number
  resting_hr?: number
  /** Gunun ortanca kan oksijeni, yuzde. */
  spo2_pct?: number
  /** Gunun en dusuk bandi - uyku apnesi isareti bu tarafta gorunur. */
  spo2_low_pct?: number
  /** HRV (RMSSD), ms. Health Connect'te stres kaydi yok; en yakin olcu bu. */
  hrv_ms?: number
  /** Uyanilan gune yazilan toplam uyku dakikasi. Samsung Health paylasimi kapaliysa hic gelmez. */
  sleep_min?: number
  /**
   * Health Connect'teki ogun kayitlarindan gelen gunluk protein grami. Sadece
   * wearable tablosuna yazilir - daily_log.protein_g elle girilen kalici katman
   * (AGENTS.md), otomatik veri onu ezmez.
   */
  protein_g?: number
  /**
   * Mansonlu cihazdan ya da saatten gelen kan basinci, gunun ortancasi. Olcumu biz
   * uretmiyoruz (docs/SENSORS-FEASIBILITY.md 2.1). daily_log.bp_systolic elle girilen
   * kalici katman - buradan gelen yalniz wearable tablosuna yazilir, onu ezmez.
   */
  bp_systolic?: number
  bp_diastolic?: number
  /** O gun okunan egzersiz seansi sayisi. */
  session_count?: number
  /**
   * O gun seanslardan okunan segment sayisi. Sema tekrari tasiyor ama bu alani
   * dolduran bir uretici **dogrulanmadi**: seans var + segment 0 ise cevap "hayir".
   */
  segment_count?: number
}

/** Bir seansin segment dokumu; seansin baslangic aninda kendi kaydimizla eslesir. */
export interface HealthSessionSegments {
  start_ms: number
  reps_total: number
  minutes: number
  /** Health Connect ExerciseSegment.segmentType sabitleri. */
  types: number[]
}

/**
 * Esigin ustunde gecirilen kesintisiz sure. Health Connect **canli nabiz vermez**:
 * bunlar gecmise donuk ornekler uzerinden cikarilir, kaynak uygulama (Samsung
 * Health) ne zaman yazdiysa o gecikmeyle gorunur.
 */
export interface HealthHrWindow {
  /** ISO anlari - takvim gunu degil, gece yarisini asan pencere bolunmez. */
  start: string
  end: string
  duration_min: number
  avg_bpm: number
  peak_bpm: number
}

/** Implemented in android/app/src/main/java/com/evaitec/wellness/HealthExtraPlugin.kt. */
const HealthExtra = registerPlugin<{
  available(): Promise<{ available: boolean }>
  checkExtraPermissions(): Promise<{ granted: boolean }>
  requestExtraPermissions(): Promise<{ granted: boolean }>
  readDaily(range: { startDate: string; endDate: string }): Promise<{
    days: HealthExtraDay[]
    windows?: HealthHrWindow[]
    sessions?: HealthSessionSegments[]
    /** En taze nabiz ornegi kac dakika geriden geliyor - gercek gecikmenin olcusu. */
    hr_lag_min?: number
  }>
  configureBackgroundSync(opts: { base: string; token: string; everyHours: number }): Promise<{
    scheduled: boolean
  }>
}>('HealthExtra')

/**
 * Uygulama kapaliyken de olcum aksin: 8 saatte bir arka plan isi Health Connect'i
 * okuyup sunucuya yazar. Adres ve token JS tarafinda durdugu icin her acilista
 * tazeleniyor - kullanici sunucuyu degistirince is de yeni adrese yazar.
 */
export async function scheduleBackgroundSync(everyHours = 8): Promise<boolean> {
  if (!isNative()) return false
  const token = getToken()
  const base = getApiBase() || window.location.origin
  if (!token) return false
  try {
    const { scheduled } = await HealthExtra.configureBackgroundSync({ base, token, everyHours })
    return scheduled
  } catch {
    return false
  }
}

/** Kan oksijeni ve HRV izni ayri sorulur: capacitor-health bu ikisini isteyemiyor. */
export async function requestExtraPermissions(): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { granted } = await HealthExtra.requestExtraPermissions()
    return granted
  } catch {
    return false
  }
}

/** Only what the watch actually measures. Every one of these is declared in AndroidManifest. */
const PERMISSIONS: HealthPermission[] = [
  'READ_STEPS',
  'READ_ACTIVE_CALORIES',
  'READ_WEIGHT',
  'READ_WORKOUTS',
  // Bu ikisini capacitor-health okuyamiyor ama izni isteyebiliyor; okumayi kendi
  // HealthExtra eklentimiz yapiyor (android/.../HealthExtraPlugin.kt).
  'READ_TOTAL_CALORIES',
  'READ_HEART_RATE',
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

/** HH:MM, yerel. */
function clock(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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
  // Kan oksijeni ve HRV ayri bir onay ekrani: capacitor-health bu ikisini isteyemiyor.
  // Reddedilmesi digerlerini gecersiz kilmaz, o yuzden sonucu yutuyoruz.
  await requestExtraPermissions()
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
  const today0 = toLocalDate()
  const dismissed = await dismissedWorkouts()

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

  // capacitor-health'in okuyamadigi olcumler, kendi eklentimizden geliyor: toplam
  // kalori (HC'de aktif kalori bos, dolu olan bu), nabiz, kan oksijeni, HRV, uyku, protein.
  let hrWindows: HealthHrWindow[] = []
  const segmentsByStart = new Map<number, HealthSessionSegments>()
  try {
    const extra = await HealthExtra.readDaily({ startDate, endDate })
    const metrics = [
      'total_kcal', 'resting_hr', 'spo2_pct', 'spo2_low_pct', 'hrv_ms', 'sleep_min', 'protein_g',
      'bp_systolic', 'bp_diastolic', 'session_count', 'segment_count',
    ] as const
    for (const day of extra.days) {
      for (const metric of metrics) {
        const value = day[metric]
        if (value == null) continue
        records.push({ id: `${day.date}:${metric}`, date: day.date, metric, value, source: SOURCE, synced_at })
      }
    }
    hrWindows = extra.windows ?? []
    for (const session of extra.sessions ?? []) segmentsByStart.set(session.start_ms, session)
    // Gecikme olculur, varsayilmaz: Health Connect canli akis vermedigi icin
    // "nabiz ne kadar geriden geliyor" sorusunun tek kanitli cevabi bu sayi.
    if (extra.hr_lag_min != null) {
      records.push({ id: `${today0}:hr_lag_min`, date: today0, metric: 'hr_lag_min', value: extra.hr_lag_min, source: SOURCE, synced_at })
    }
  } catch {
    // Izin verilmedi ya da Health Connect yok: diger olcumler yine yazilir.
  }

  // Sessions the watch detected on its own. Written with a deterministic id so a
  // repeated sync updates the same row instead of duplicating the session.
  // Cihaz tipi biliyorsa (yuzme, kosu...) soru sorulmaz, kayit onaya dusurulur.
  const sessions: { from: number; to: number }[] = []
  try {
    const res = await Health.queryWorkouts({ startDate, endDate, includeHeartRate: false, includeRoute: false, includeSteps: false })
    for (const w of res.workouts) {
      const start = new Date(w.startDate)
      sessions.push({ from: start.getTime(), to: new Date(w.endDate).getTime() })
      const minutes = Math.round((new Date(w.endDate).getTime() - start.getTime()) / 60000)
      const id = await stableId(`${SOURCE}:${w.startDate}:${w.workoutType}`)
      if (dismissed.has(id)) continue
      const existing = await db.workout.get(id)
      if (isAnswered(existing)) continue // onaylanmis: set/agirlik/tip kullanicinin
      const known = detectedExercise(w.workoutType ?? '')
      // Saat seansi segmentlediyse tekrar sayisi ve kas grubu bedava gelir. Ikisi de
      // kullanicinin girdigini **ezmez**: dolu olan kalir (AGENTS "manuel giris kalici").
      const seg = segmentsByStart.get(start.getTime())
      const segMuscles = seg ? segmentMusclesOf(seg.types) : []
      const entry: Workout = {
        id,
        date: toLocalDate(start),
        // Tanimadigimiz tip icin uydurulmuyor: kova kardiyoya dusuruluyor ama
        // kayit needs_review kaliyor, dogru tipi kullanici secer.
        type: known?.type ?? 'cardio',
        duration_min: minutes > 0 ? minutes : null,
        sets_total: null,
        muscle_groups: existing?.muscle_groups?.length ? existing.muscle_groups : segMuscles,
        reps_total: existing?.reps_total ?? (seg && seg.reps_total > 0 ? seg.reps_total : null),
        // Saat sureyi bilir, ne yapildigini bilmeyebilir: kullanici onaylayana
        // kadar kartta bekler. Zaten onaylanmissa tekrar sorulmaz.
        needs_review: existing?.needs_review ?? true,
        // ReviewWorkout bu onekten "saat tanidi mi" ayrimini okuyor.
        // ponytail: notes onekiyle; ayri bir sutun db/005 + API semasi + migration
        // demekti, kazanci tek satirlik bir ekran metni.
        notes: `saat: ${known?.label ?? w.workoutType ?? 'antrenman'}${w.calories ? ` · ${Math.round(w.calories)} kcal` : ''}`,
      }
      await upsertWorkout(entry)
    }
  } catch {
    // no workout permission, or none recorded in the window
  }

  // Saat bir seans kaydetmediyse ama nabiz uzun sure yuksek kaldiysa, o pencereyi
  // kullaniciya sor. Ustunu ortmemek icin: bu **canli** bir olcum degil, gecmise
  // donuk orneklerden cikarilmis bir tahmin (hr_lag_min gecikmeyi olcuyor).
  //
  // Telefonun hareket verisi varsa once o sorulur: pencere kosu/bisiklet/yuruyus
  // araligiyla ortusuyorsa tip cikarilir ve kayit soru degil **onay** olur; aractaki
  // pencere hic gorunmez. Gunluk soru siniri yalniz cikarilamayanlari sayar.
  const intervals = await activityIntervals()
  const candidates: { startMs: number; endMs: number; date: string; id: string; win: HealthHrWindow }[] = []
  for (const win of hrWindows) {
    const from = new Date(win.start).getTime()
    const to = new Date(win.end).getTime()
    if (sessions.some((s) => s.from < to && from < s.to)) continue // cihaz zaten biliyor
    const id = await stableId(`hr:${win.start}`)
    if (dismissed.has(id)) continue
    const existing = await db.workout.get(id)
    if (isAnswered(existing)) continue // cevaplanmis
    // Pencere mutlak zaman; gune yazma karari burada verilir - basladigi gun.
    candidates.push({ startMs: from, endMs: to, date: toLocalDate(new Date(win.start)), id, win })
  }
  for (const { window: cand, match } of planHrWindows(candidates, intervals)) {
    const win = cand.win
    await upsertWorkout({
      id: cand.id,
      date: cand.date,
      // Tip telefondan cikarildiysa kullanilir; cikarilamadiysa kova kardiyoya
      // dusurulur ama soru acik sorulur (ReviewWorkout notes onekinden ayirir).
      type: match?.type ?? 'cardio',
      duration_min: win.duration_min > 0 ? win.duration_min : null,
      sets_total: null,
      muscle_groups: [],
      needs_review: true,
      notes: match
        ? `telefon: ${clock(win.start)}-${clock(win.end)} ${match.label}`
        : `nabız: ${clock(win.start)}-${clock(win.end)} arası ${win.peak_bpm} bpm'e çıktı`,
    })
  }

  if (records.length === 0) return 0
  await db.wearable.bulkPut(records)

  // The watch wins for steps (SPEC 3), but the manual value is never deleted -
  // it stays in wearable/daily_log history, we only surface the automatic one.
  const todaySteps = records.find((r) => r.date === today0 && r.metric === 'steps')
  if (todaySteps) {
    // Saat gun icinde artan bir sayac; elle girilen daha buyuk bir deger varsa onu
    // ezmek veri kaybidir (telefon cepte degilken yurunen adim saatte yok).
    const manual = (await db.daily_log.get(today0))?.steps ?? 0
    const watch = Math.round(todaySteps.value)
    if (watch > manual) await saveDaily(today0, { steps: watch })
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
