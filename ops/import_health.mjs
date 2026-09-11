// Health Connect disa aktarimini (.zip veya .db) gunluge aktarir.
// Telefonda: Health Connect -> Verileri yonetin -> Disa aktar.
//
//   npm run import:health -- <yol>              -> API'ye yazar
//   npm run import:health -- <yol> --dry-run    -> sadece ozet basar
//   npm run import:health -- <yol> --api http://192.168.1.185:3311
//
// Health Connect her araligi ayri satir tutar ve ayni gunu birden fazla uygulama
// yazar (Fitbit + Samsung Health + Health Connect'in kendisi). Gunluk toplami
// SUM ile almak ayni adimi uc kez sayar; bu yuzden kaynak basina toplayip
// gunun EN YUKSEK tek kaynagini aliyoruz.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = 'health_connect'

/** .env'i okur (ops/phone_link.mjs ile ayni kaynak). */
function readEnv(name) {
  const line = readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`))
  if (!line) throw new Error(`${name} .env icinde yok`)
  const value = line.slice(name.length + 1).trim()
  if (!value) throw new Error(`${name} bos`)
  return value
}

/** Zip verildiyse gecici dizine acar ve icindeki .db yolunu dondurur. */
function openExport(path) {
  if (!path.toLowerCase().endsWith('.zip')) return { dbPath: path, cleanup: () => {} }
  const dir = mkdtempSync(join(tmpdir(), 'hc-'))
  // Git Bash'in GNU tar'i "C:" yi uzak makine sanip reddediyor; Windows'un kendi
  // bsdtar'i tam yolla cagrilinca dogru calisiyor.
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar'
  execFileSync(tar, ['-xf', path, '-C', dir])
  const db = readdirSync(dir).find((f) => f.endsWith('.db'))
  if (!db) throw new Error('zip icinde .db yok')
  return { dbPath: join(dir, db), cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

/** Health Connect'in epoch-gun sayisini (local_date) ISO tarihe cevirir. */
function isoDate(epochDay) {
  return new Date(epochDay * 86400000).toISOString().slice(0, 10)
}

/**
 * Gun basina tek kaynak secer: her kaynagin gunluk toplamini hesaplar, en
 * yuksegini alir. Kaynaklar ayni adimi ayri ayri yazdigi icin toplama yapilmaz.
 */
function dailyMax(db, table, column) {
  const rows = db
    .prepare(`select local_date as day, app_info_id as app, sum(${column}) as total
              from ${table} group by 1, 2`)
    .all()
  const best = new Map()
  for (const { day, total } of rows) {
    if (!best.has(day) || best.get(day) < total) best.set(day, total)
  }
  return best
}

/** Gun basina nabiz ozeti: ortalama ve en dusuk (dinlenmeye en yakin) deger. */
function heartRate(db) {
  return db
    .prepare(`select h.local_date as day, avg(s.beats_per_minute) as avg_bpm,
                     min(s.beats_per_minute) as min_bpm, count(*) as n
              from heart_rate_record_table h
              join heart_rate_record_series_table s on s.parent_key = h.row_id
              group by 1`)
    .all()
}

/** Blob uuid'yi metin uuid'ye cevirir; ayni seansin iki kez eklenmesini onler. */
function uuidText(blob) {
  const hex = Buffer.from(blob).toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/** Disa aktarimi okur, yazilacak kayitlari uretir. Saf: API'ye dokunmaz. */
export function collect(db) {
  const wearable = []
  const daily = new Map()
  const push = (date, metric, value) => wearable.push({ date, source: SOURCE, metric, value })

  for (const [day, steps] of dailyMax(db, 'steps_record_table', 'count')) {
    const date = isoDate(day)
    push(date, 'steps', Math.round(steps))
    daily.set(date, { ...daily.get(date), steps: Math.round(steps) })
  }
  // Health Connect enerjiyi kucuk kalori tutar; kcal icin bine bolunur.
  for (const [day, energy] of dailyMax(db, 'total_calories_burned_record_table', 'energy')) {
    push(isoDate(day), 'total_kcal', Math.round(energy / 1000))
  }
  for (const { day, avg_bpm, min_bpm } of heartRate(db)) {
    const date = isoDate(day)
    push(date, 'avg_hr', Math.round(avg_bpm))
    push(date, 'resting_hr', min_bpm)
  }
  // Kilo gram cinsinden; gunun son olcumu gecerli sayilir.
  for (const r of db.prepare('select local_date as day, weight from weight_record_table order by time').all()) {
    const date = isoDate(r.day)
    const kg = Math.round((r.weight / 1000) * 10) / 10
    push(date, 'weight_kg', kg)
    daily.set(date, { ...daily.get(date), weight_kg: kg })
  }

  // Egzersiz seanslari: Health Connect tipi sayisal, karsiligi bizim semada yok.
  // Sure disinda veri tasimadiklari icin 'cardio' sayilip ham tip nota yaziliyor.
  const workouts = db
    .prepare(`select uuid, local_date as day, exercise_type as type,
                     (end_time - start_time) / 60000 as minutes
              from exercise_session_record_table`)
    .all()
    .map((w) => ({
      id: uuidText(w.uuid),
      date: isoDate(w.day),
      type: 'cardio',
      duration_min: Math.round(w.minutes),
      muscle_groups: [],
      notes: `Health Connect (tip ${w.type})`,
    }))

  return { wearable, daily: [...daily.entries()], workouts }
}

async function send(api, token, method, path, body) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`)
  return res.json()
}

const args = process.argv.slice(2)
const path = args.find((a) => !a.startsWith('--'))
if (!path) {
  console.error('kullanim: npm run import:health -- <disa-aktarim.zip|.db> [--dry-run]')
  process.exit(1)
}
const dryRun = args.includes('--dry-run')
const apiIndex = args.indexOf('--api')
const api = apiIndex >= 0 ? args[apiIndex + 1] : 'http://127.0.0.1:3011'

const { dbPath, cleanup } = openExport(path)
let result
try {
  const db = new DatabaseSync(dbPath, { readOnly: true })
  result = collect(db)
  db.close()
} finally {
  cleanup()
}

const { wearable, daily, workouts } = result
const days = daily.map(([date]) => date).sort()
console.log(`${days.length} gun  ${days[0]} -> ${days[days.length - 1]}`)
console.log(`  olcum kaydi : ${wearable.length}`)
console.log(`  gunluk satir: ${daily.length}`)
console.log(`  antrenman   : ${workouts.length}`)

if (dryRun) {
  const son = daily.slice(-5)
  for (const [date, v] of son) console.log(`  ${date}  adim ${v.steps ?? '-'}  kilo ${v.weight_kg ?? '-'}`)
  console.log('\n--dry-run: hicbir sey yazilmadi')
  process.exit(0)
}

const token = readEnv('API_TOKEN')
// Uc parti da tekrar calistirmaya dayanikli: wearable (date,source,metric) uzerine
// yazar, daily gun bazli PUT, workout id ile 'on conflict do nothing'.
for (let i = 0; i < wearable.length; i += 500) {
  await send(api, token, 'POST', '/api/wearable', { records: wearable.slice(i, i + 500) })
}
for (const [date, values] of daily) {
  await send(api, token, 'PUT', `/api/daily/${date}`, values)
}
for (const w of workouts) {
  await send(api, token, 'POST', '/api/workouts', w)
}
console.log('\nyazildi.')
