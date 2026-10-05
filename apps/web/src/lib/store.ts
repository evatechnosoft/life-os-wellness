import { api, ApiError, getToken } from './api'
import {
  db,
  type DailyLog,
  type Meal,
  type Measurement,
  type OutboxEntry,
  type Retro,
  type WearableRecord,
  type Workout,
  wearableId,
} from './db'
import { dailyPatch } from './measurements'

const now = () => new Date().toISOString()

/** True when a server is configured. Without a token the app is standalone: IndexedDB is the only store. */
export function hasServer(): boolean {
  return getToken() !== ''
}

/** Every write lands in IndexedDB first, then queues for the server. Never awaits the network. */
async function queue(entry: Omit<OutboxEntry, 'id' | 'queued_at'>): Promise<void> {
  if (!hasServer()) return
  await db.outbox.add({ ...entry, queued_at: now() })
  void syncOutbox()
}

/** Haftalik ajandayi kuyruga koyar; ajanda tek satirlik bir ayar, gun bazli uc yok. */
export async function queueSplit(split: Record<number, string[]>): Promise<void> {
  const days = Object.entries(split).map(([weekday, muscle_groups]) => ({ weekday: Number(weekday), muscle_groups }))
  await queue({ method: 'PUT', path: '/api/split', body: { days } })
}

/** Tek gunun notu. Ajanda alani gonderilmez ki sunucudaki gruplar korunsun. */
export async function queueSplitNote(weekday: number, note: string): Promise<void> {
  await queue({ method: 'PUT', path: '/api/split', body: { days: [{ weekday, note: note || null }] } })
}

/** Haftalik seans plani (db/008). Gonderilmeyen alana sunucu dokunmaz. */
export async function queueWorkoutPlan(days: object[]): Promise<void> {
  await queue({ method: 'PUT', path: '/api/workout-plan', body: { days } })
}

/** Hedefler tek satir jsonb (db/007); sunucu birlestirir. */
export async function queueGoals(goals: object): Promise<void> {
  await queue({ method: 'PUT', path: '/api/goals', body: goals })
}

/** Profil tek satir (db/006): tum alanlar birlikte gider, alan bazli uc yok. */
export async function queueProfile(profile: object): Promise<void> {
  await queue({ method: 'PUT', path: '/api/profile', body: profile })
}

/**
 * Bildirim zamanlamasi o gunun verisine bakiyor, veri degisince yeniden kurulmali.
 * Dinamik import: reminders -> health -> store dongusunu modul grafiginde acmamak icin.
 */
function refreshReminders(): void {
  void import('./reminders').then((m) => m.refreshNotifications()).catch(() => {})
}

export async function saveDaily(date: string, patch: Partial<DailyLog>): Promise<void> {
  const existing = await db.daily_log.get(date)
  await db.daily_log.put({ ...existing, ...patch, date, updated_at: now() })
  await queue({ method: 'PUT', path: `/api/daily/${date}`, body: patch })
  // Yalniz tarti bildirimini ilgilendiren alan; adim senkronu her 15 dk geliyor.
  if ('weight_kg' in patch) refreshReminders()
}

/** Protein arrives as meal-sized pulses through the day; each one adds to the day's total. */
export async function addProtein(date: string, grams: number): Promise<void> {
  const existing = await db.daily_log.get(date)
  const total = (existing?.protein_g ?? 0) + grams
  await saveDaily(date, { protein_g: total })
}

export async function addWorkout(workout: Omit<Workout, 'id'>): Promise<void> {
  const entry: Workout = { ...workout, id: crypto.randomUUID() }
  await db.workout.put(entry)
  await queue({ method: 'POST', path: '/api/workouts', body: entry })
}

/** Writes a workout whose id is already known (watch-detected sessions). Idempotent end to end. */
export async function upsertWorkout(workout: Workout): Promise<void> {
  const existing = await db.workout.get(workout.id)
  if (existing && JSON.stringify(existing) === JSON.stringify(workout)) return
  await db.workout.put(workout)
  await queue({ method: 'POST', path: '/api/workouts', body: workout })
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.workout.delete(id)
  await queue({ method: 'DELETE', path: `/api/workouts/${id}` })
}

const DISMISSED_KEY = 'dismissed_workouts'

/** Saatin/nabzin onerdigi ama kullanicinin reddettigi seanslarin id'leri. */
export async function dismissedWorkouts(): Promise<Set<string>> {
  const stored = await db.settings.get(DISMISSED_KEY)
  return new Set((stored?.value as string[] | undefined) ?? [])
}

/**
 * "Ben degildim". Silmek tek basina yetmez: bir sonraki senkron ayni seansi
 * ayni deterministik id ile yeniden yazar ve soru geri gelir. Reddedilen id
 * kalici olarak isaretlenir, senkron onu bir daha uretmez.
 */
export async function dismissWorkout(id: string): Promise<void> {
  const ids = await dismissedWorkouts()
  ids.add(id)
  // Liste sinirsiz buyumesin; en eski redler zaten senkron penceresinin disinda kalir.
  await db.settings.put({ key: DISMISSED_KEY, value: [...ids].slice(-200) })
  await deleteWorkout(id)
}

/**
 * Ogunu kuyruga koyar. Fotograf gitmez: cihazda kalir (PLAN-DIET S6), zaten
 * Blob JSON'a serilesmez. Id istemcide uretildigi icin POST idempotenttir.
 */
export async function queueMeal(meal: Meal): Promise<void> {
  const { photo: _photo, ...body } = meal
  await queue({ method: 'POST', path: '/api/meals', body })
  refreshReminders()
}

export async function queueMealDelete(id: string): Promise<void> {
  await queue({ method: 'DELETE', path: `/api/meals/${id}` })
}

/**
 * Tek olcumu yazar. Gunun ozeti (daily_log) burada da tazeleniyor: trend, 7-gun
 * ortalamasi ve koc metinleri daily_log'u okuyor - iki yere yazmak, o kodun
 * degismesinden ucuz.
 */
export async function saveMeasurement(row: Measurement): Promise<void> {
  await db.measurement.put(row)
  await queue({ method: 'POST', path: '/api/measurements', body: row })
  await syncDayFromMeasurements(row.date)
}

export async function deleteMeasurement(id: string): Promise<void> {
  const row = await db.measurement.get(id)
  await db.measurement.delete(id)
  await queue({ method: 'DELETE', path: `/api/measurements/${id}` })
  // Kalan olcumler gunun degerini yeniden belirler; hic kalmadiysa daily_log'a dokunulmaz.
  if (row) await syncDayFromMeasurements(row.date)
}

/** Gunun olcumlerinden daily_log kilo/tansiyonu (yalniz degisen alan, outbox'la sunucuya). */
async function syncDayFromMeasurements(date: string, onlyEmpty = false): Promise<void> {
  const patch = dailyPatch(await db.measurement.where('date').equals(date).toArray(), await db.daily_log.get(date), onlyEmpty)
  if (Object.keys(patch).length > 0) await saveDaily(date, patch)
}

let syncing = false

/** Entries the server refused for good. Kept so the rejection can be shown, not guessed at. */
export const REJECTED_KEY = 'outbox_rejected'

/** What a failed outbox entry means for the queue. */
export type Verdict = 'done' | 'retry' | 'rejected'

/**
 * The drain stops at the first failure so that later writes never overtake earlier
 * ones -- which means an entry that can never succeed freezes everything behind it.
 * So the question each failure has to answer is whether waiting could ever help.
 *
 * - `done`: DELETE met a row that is already gone. That is the outcome we asked for.
 * - `retry`: offline, 5xx, 408/429, or the token is wrong (401/403). Dean fixing the
 *   token must not cost him the writes queued before he noticed.
 * - `rejected`: any other 4xx. The server judged the body itself; the same bytes will
 *   be refused tomorrow. Holding it only buries the writes behind it.
 */
export function verdictFor(err: unknown, method: OutboxEntry['method']): Verdict {
  if (!(err instanceof ApiError)) return 'retry'
  const { status } = err
  if (status === 404 && method === 'DELETE') return 'done'
  if (status === 401 || status === 403 || status === 408 || status === 429) return 'retry'
  return status >= 400 && status < 500 ? 'rejected' : 'retry'
}

/**
 * Drains the outbox in order. A rejected entry leaves the queue and is recorded; one
 * worth retrying stays and stops the drain, so order holds.
 */
export async function syncOutbox(): Promise<number> {
  if (syncing || !navigator.onLine || !hasServer()) return 0
  syncing = true
  let sent = 0
  try {
    const entries = await db.outbox.orderBy('id').toArray()
    for (const entry of entries) {
      try {
        await api(entry.path, {
          method: entry.method,
          body: entry.body === undefined ? undefined : JSON.stringify(entry.body),
        })
      } catch (err) {
        const verdict = verdictFor(err, entry.method)
        if (verdict === 'retry') return sent
        if (verdict === 'rejected') await recordRejection(entry, err)
      }
      if (entry.id !== undefined) await db.outbox.delete(entry.id)
      sent += 1
    }
  } finally {
    syncing = false
  }
  return sent
}

/**
 * A rejected write is gone from the server's point of view but still in IndexedDB, so
 * nothing is lost locally -- what would be lost is knowing it never landed.
 */
async function recordRejection(entry: OutboxEntry, err: unknown): Promise<void> {
  const reason = err instanceof Error ? err.message : String(err)
  console.warn('outbox: sunucu reddetti, kuyruktan dusuruldu', entry.method, entry.path, reason)
  const stored = await db.settings.get(REJECTED_KEY)
  const previous = (stored?.value as unknown[] | undefined) ?? []
  const record = { method: entry.method, path: entry.path, queued_at: entry.queued_at, reason }
  // Son 20 yeter: amac hata ayiklamak, arsiv tutmak degil.
  await db.settings.put({ key: REJECTED_KEY, value: [...previous, record].slice(-20) })
}

/**
 * Gunun proteini en az o gunun ogun toplami. Uygulama ogun kaydederken
 * daily_log.protein_g'yi kendisi artiriyor; sohbetten API'ye yazilan ogun bunu
 * yapmiyor (2 Eki: ogunler 177 g, halka 0/180). Halka, hafta ve koc daily_log
 * okudugu icin tek duzeltme yeri cekilen veri.
 * ponytail: max - ogun baska cihazdan silinirse/dusurulurse yerel toplam
 * yuksek kalabilir; elle protein dugmesi ile ogunu ayirmak icin ayri alan gerekir.
 */
export function withMealProtein(daily: DailyLog[], meals: Meal[], stamp: string): DailyLog[] {
  const sums = new Map<string, number>()
  for (const m of meals) sums.set(m.date, (sums.get(m.date) ?? 0) + (m.protein_g ?? 0))
  const byDate = new Map(daily.map((d) => [d.date, d]))
  for (const [date, sum] of sums) {
    const row = byDate.get(date)
    if (sum > (row?.protein_g ?? 0)) byDate.set(date, { ...(row ?? { date, updated_at: stamp }), protein_g: sum })
  }
  return [...byDate.values()]
}

/** Pulls the server's copy into IndexedDB. Used on load so a second device sees existing data. */
/** Outbox'ta hala gonderilmeyi bekleyen kayit id'leri (POST govdesi ya da DELETE yolu). */
export function pendingIds(outbox: Pick<OutboxEntry, 'method' | 'path' | 'body'>[]): Set<string> {
  const ids = new Set<string>()
  for (const e of outbox) {
    const bodyId = (e.body as { id?: unknown } | undefined)?.id
    if (e.method === 'POST' && typeof bodyId === 'string') ids.add(bodyId)
    // Wearable toplu yazimi: satir basina id yok, yerel anahtar turetilir.
    const records = (e.body as { records?: { date: string; source: string; metric: string }[] } | undefined)?.records
    if (e.method === 'POST' && Array.isArray(records)) for (const r of records) ids.add(wearableId(r.date, r.source, r.metric))
    if (e.method === 'DELETE') ids.add(e.path.slice(e.path.lastIndexOf('/') + 1))
  }
  return ids
}

/**
 * Sunucu tek gercek (PLAN-DUZELTME D2): cekilen aralikta yerelde olup sunucuda olmayan
 * satir baska yerden (sohbet, diger cihaz) silinmistir. Outbox'ta bekleyen satir haric:
 * o henuz sunucuya ulasmamis yerel kayittir.
 */
export function staleIds(local: { id: string }[], server: { id: string }[], pending: Set<string>): string[] {
  const live = new Set(server.map((r) => r.id))
  return local.filter((r) => !live.has(r.id) && !pending.has(r.id)).map((r) => r.id)
}

export async function pullRange(start: string, end: string): Promise<void> {
  const query = `?start=${start}&end=${end}`
  const [daily, workouts, retros, wearable, meals, measurements] = await Promise.all([
    api<DailyLog[]>(`/api/daily${query}`),
    api<Workout[]>(`/api/workouts${query}`),
    api<Retro[]>(`/api/retro${query}`),
    api<WearableRecord[]>(`/api/wearable${query}`),
    api<Meal[]>(`/api/meals${query}`),
    api<Measurement[]>(`/api/measurements${query}`),
  ])
  // Dizi bicimi: Dexie'nin tek tek tablo alan imzasi bes tabloda bitiyor.
  await db.transaction('rw', [db.daily_log, db.workout, db.retro, db.wearable, db.meal, db.measurement, db.outbox], async () => {
    const stamp = now()
    const pending = pendingIds(await db.outbox.toArray())
    const span = [start, end, true, true] as const
    await db.workout.bulkDelete(staleIds(await db.workout.where('date').between(...span).toArray(), workouts, pending))
    await db.meal.bulkDelete(staleIds(await db.meal.where('date').between(...span).toArray(), meals, pending))
    await db.measurement.bulkDelete(staleIds(await db.measurement.where('date').between(...span).toArray(), measurements, pending))
    await db.daily_log.bulkPut(withMealProtein(daily.map((d) => ({ ...d, updated_at: d.updated_at ?? stamp })), meals, stamp))
    await db.workout.bulkPut(workouts)
    await db.retro.bulkPut(retros.map((r) => ({ ...r, updated_at: r.updated_at ?? now() })))
    // Sunucu kendi uuid'sini veriyor; yerel anahtar (gun, kaynak, metrik) oldugu icin
    // yeniden cekmek satiri cogaltmasin diye id burada turetiliyor.
    const pulledWearable = wearable.map((w) => ({ ...w, id: wearableId(w.date, w.source, w.metric) }))
    await db.wearable.bulkDelete(staleIds(await db.wearable.where('date').between(...span).toArray(), pulledWearable, pending))
    await db.wearable.bulkPut(pulledWearable)
    // Fotograf sunucuda yok; cekilen kopya yerel fotografi silmesin.
    const local = await db.meal.bulkGet(meals.map((m) => m.id))
    await db.meal.bulkPut(meals.map((m, i) => (local[i]?.photo ? { ...m, photo: local[i]!.photo } : m)))
    await db.measurement.bulkPut(measurements)
  })
  // Sohbetten/baska cihazdan yazilan olcum de trende girsin (PLAN-DUZELTME D4).
  // Yalniz bos alan: sunucudaki gun degeri baska kaynaktan (kolluk, sohbet) gelmis olabilir.
  for (const date of new Set(measurements.map((m) => m.date))) await syncDayFromMeasurements(date, true)
  // Sunucu tek gercek: bildirimler ancak cekilen veriye gore kurulur. Sohbetten
  // API'ye yazilan kilo/ogun telefona inmeden "girmedin" bildirimi kurulmasin.
  refreshReminders()
  // Saat ozeti (Ozet ekrani). Dinamik import: watchSummary -> workoutPlan -> store dongusu.
  void import('./watchSummary').then((m) => m.pushWatchSummary()).catch(() => {})
}

/**
 * Single path for every sensor source (watch, phone mic, camera): write the day's
 * metrics locally, then forward them if a server is configured. Keyed by date+metric,
 * so re-reading a source refreshes its numbers instead of stacking duplicates.
 */
export async function recordMetrics(
  source: string,
  date: string,
  metrics: Record<string, number>,
): Promise<WearableRecord[]> {
  const synced_at = new Date().toISOString()
  const records: WearableRecord[] = Object.entries(metrics)
    .filter(([, value]) => Number.isFinite(value))
    .map(([metric, value]) => ({ id: wearableId(date, source, metric), date, metric, value, source, synced_at }))
  if (records.length === 0) return []

  await db.wearable.bulkPut(records)
  // Through the outbox, not a direct call: the one-shot sources (a meal photo's
  // calories, a sleep reading) get no second chance, so a write made offline has to
  // survive until the network comes back. Re-sending is safe, the key is date+metric.
  await queue({
    method: 'POST',
    path: '/api/wearable',
    body: { records: records.map(({ date: d, source: s, metric, value }) => ({ date: d, source: s, metric, value })) },
  })
  return records
}

/** Bir gunun bir kaynaktan gelen tum degerlerini siler (yanlis tarti girisi). */
export async function deleteWearable(date: string, source: string): Promise<void> {
  await db.wearable.where('date').equals(date).filter((r) => r.source === source).delete()
  await queue({ method: 'DELETE', path: `/api/wearable?date=${date}&source=${encodeURIComponent(source)}` })
}

export function startSyncLoop(): () => void {
  const tick = () => void syncOutbox()
  window.addEventListener('online', tick)
  const timer = window.setInterval(tick, 30_000)
  tick()
  return () => {
    window.removeEventListener('online', tick)
    window.clearInterval(timer)
  }
}
