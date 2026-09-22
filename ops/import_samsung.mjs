// Samsung Health disa aktarimini (zip veya acilmis klasor) gunluge aktarir.
// Telefonda: Samsung Health -> Ayarlar -> Kisisel veriler -> Verileri indir.
//
//   npm run import:samsung -- <yol>            -> API'ye yazar
//   npm run import:samsung -- <yol> --dry-run  -> sadece ozet basar
//   npm run import:samsung -- <yol> --api http://192.168.1.185:3311
//
// Ne alinir: gunluk adim, kilo, tansiyon. Egzersiz seanslari ALINMAZ - Samsung'un
// exercise_type kodlari bizim tiplere birebir oturmuyor, 584 satir "bu neydi?"
// kartina dusup gunluk akisi bogardi. Gerekirse ayri bir adimda eklenir.
//
// Tekrar calistirmaya dayanikli: wearable (date,source,metric) uzerine yazar,
// daily_log'a ise YALNIZ bos alanlar doldurulur - Health Connect'in ya da elle
// girilen degerin uzerine yazilmaz (arsiv eski, canli kayit daha guvenilir).
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = 'samsung_csv'

/** .env'i okur (ops/import_health.mjs ile ayni desen). */
function readEnv(name) {
  const line = readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`))
  if (!line) throw new Error(`${name} .env icinde yok`)
  const value = line.slice(name.length + 1).trim()
  if (!value) throw new Error(`${name} bos`)
  return value
}

/** Zip verildiyse gecici dizine acar; klasor verildiyse oldugu gibi kullanir. */
function openExport(path) {
  if (statSync(path).isDirectory()) return { dir: path, cleanup: () => {} }
  const dir = mkdtempSync(join(tmpdir(), 'sh-'))
  // Git Bash'in GNU tar'i "C:" yi uzak makine sanip reddediyor; Windows'un kendi
  // bsdtar'i tam yolla cagrilinca dogru calisiyor (import_health.mjs ile ayni not).
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar'
  execFileSync(tar, ['-xf', path, '-C', dir])
  const inner = readdirSync(dir).find((f) => f.startsWith('samsunghealth_'))
  return { dir: inner ? join(dir, inner) : dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

/** RFC4180 alt kumesi: tirnakli alan, ikilenmis tirnak. Bagimlilik eklemeye degmez. */
export function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

/** Samsung CSV'si: 1. satir meta, 2. satir baslik. Nesne dizisi dondurur. */
function readTable(dir, name) {
  const file = readdirSync(dir).find((f) => f.startsWith(name) && f.endsWith('.csv'))
  if (!file) throw new Error(`${name}*.csv arsivde yok`)
  const text = readFileSync(join(dir, file), 'utf8').replace(/^﻿/, '')
  const rows = parseCsv(text)
  const head = rows[1]
  return rows.slice(2)
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])))
}

/**
 * Samsung zaman damgalari UTC, ofset ayri kolonda ("UTC+0300"). Yerel gunu
 * ofseti ekleyerek turetiriz; ham toISOString ile gun turetmek gunu geri atar.
 */
export function localDay(timestamp, offset) {
  const utc = Date.parse(`${timestamp.replace(' ', 'T')}Z`)
  const m = /^UTC([+-])(\d{2})(\d{2})$/.exec(offset ?? '')
  const shift = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60000 : 0
  return new Date(utc + shift).toISOString().slice(0, 10)
}

/** Arsivi okur, yazilacak kayitlari uretir. Saf: API'ye dokunmaz. */
export function collect(dir) {
  const wearable = []
  const daily = new Map()
  const put = (date, field, value) => daily.set(date, { ...daily.get(date), [field]: value })
  const push = (date, metric, value) => wearable.push({ date, source: SOURCE, metric, value })

  // Adim: telefon, saat ve birlesik kayit ayni gunu uc kez yazar. Yalniz birlesik
  // satir (source_type = -2) alinir, yoksa gunluk adim uce katlanir.
  for (const r of readTable(dir, 'com.samsung.shealth.step_daily_trend')) {
    if (r.source_type !== '-2') continue
    const date = r.day_time.slice(0, 10) // day_time zaten yerel gun
    const steps = Math.round(Number(r.count))
    if (!Number.isFinite(steps)) continue
    push(date, 'steps', steps)
    put(date, 'steps', steps)
  }

  // Kilo: gunun son olcumu gecerli (satirlar zaman sirali).
  for (const r of readTable(dir, 'com.samsung.health.weight')) {
    const kg = Math.round(Number(r.weight) * 10) / 10
    if (!Number.isFinite(kg) || kg <= 0) continue
    const date = localDay(r.start_time, r.time_offset)
    push(date, 'weight_kg', kg)
    put(date, 'weight_kg', kg)
  }

  // Tansiyon: gunde birden fazla olcum olabilir, gunlukte tek alan var - son olcum.
  const bp = 'com.samsung.health.blood_pressure'
  for (const r of readTable(dir, 'com.samsung.shealth.blood_pressure')) {
    const sys = Math.round(Number(r[`${bp}.systolic`]))
    const dia = Math.round(Number(r[`${bp}.diastolic`]))
    if (!Number.isFinite(sys) || !Number.isFinite(dia) || sys < 50 || dia < 30) continue
    const date = localDay(r[`${bp}.start_time`], r[`${bp}.time_offset`])
    push(date, 'bp_systolic', sys)
    push(date, 'bp_diastolic', dia)
    put(date, 'bp_systolic', sys)
    put(date, 'bp_diastolic', dia)
  }

  return { wearable, daily: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)) }
}

// Sunucu dakikada 300 istek kabul ediyor (server.ts MAX_PER_WINDOW) ve bu limit
// gevsetilmiyor - iki yillik arsiv gun basina bir PUT ile o pencereyi asiyor.
// 429 gelince pencerenin dolmasi beklenir; tek seferlik ice aktarma icin yeterli.
async function send(api, token, method, path, body, attempt = 0) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (res.status === 429 && attempt < 5) {
    console.log('  (429: pencere doluyor, 60 sn bekleniyor)')
    await new Promise((r) => setTimeout(r, 61_000))
    return send(api, token, method, path, body, attempt + 1)
  }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`)
  return res.json()
}

// Testten import edilince CLI calismasin.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2)
  const path = args.find((a) => !a.startsWith('--'))
  if (!path) {
    console.error('kullanim: npm run import:samsung -- <arsiv.zip|klasor> [--dry-run]')
    process.exit(1)
  }
  const dryRun = args.includes('--dry-run')
  const apiIndex = args.indexOf('--api')
  const api = apiIndex >= 0 ? args[apiIndex + 1] : 'http://127.0.0.1:3011'

  const { dir, cleanup } = openExport(path)
  let result
  try {
    result = collect(dir)
  } finally {
    cleanup()
  }

  const { wearable, daily } = result
  const days = daily.map(([date]) => date)
  console.log(`${days.length} gun  ${days[0]} -> ${days[days.length - 1]}`)
  console.log(`  olcum kaydi : ${wearable.length}`)
  for (const [date, v] of daily.slice(-5)) {
    console.log(`  ${date}  adim ${v.steps ?? '-'}  kilo ${v.weight_kg ?? '-'}  ta ${v.bp_systolic ?? '-'}/${v.bp_diastolic ?? '-'}`)
  }
  if (dryRun) {
    console.log('\n--dry-run: hicbir sey yazilmadi')
    process.exit(0)
  }

  const token = readEnv('API_TOKEN')
  for (let i = 0; i < wearable.length; i += 500) {
    await send(api, token, 'POST', '/api/wearable', { records: wearable.slice(i, i + 500) })
  }

  // Gunluk: yalniz bos alan doldurulur. Once aralik okunur, dolu alan atlanir.
  const range = await fetch(`${api}/api/daily?start=${days[0]}&end=${days[days.length - 1]}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  if (!range.ok) throw new Error(`GET /api/daily -> ${range.status}`)
  const existing = new Map((await range.json()).map((row) => [row.date, row]))

  let written = 0
  let skipped = 0
  for (const [date, values] of daily) {
    const row = existing.get(date) ?? {}
    const patch = Object.fromEntries(
      Object.entries(values).filter(([k]) => row[k] === undefined || row[k] === null),
    )
    if (Object.keys(patch).length === 0) { skipped++; continue }
    await send(api, token, 'PUT', `/api/daily/${date}`, patch)
    written++
  }
  console.log(`\nyazildi. gunluk: ${written} gun dolduruldu, ${skipped} gun zaten doluydu.`)
}
