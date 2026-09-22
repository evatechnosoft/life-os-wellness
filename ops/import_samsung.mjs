// Samsung Health disa aktarimini (zip veya acilmis klasor) gunluge aktarir.
// Telefonda: Samsung Health -> Ayarlar -> Kisisel veriler -> Verileri indir.
//
//   npm run import:samsung -- <yol>            -> API'ye yazar
//   npm run import:samsung -- <yol> --dry-run  -> sadece ozet basar
//   npm run import:samsung -- <yol> --api http://192.168.1.185:3311
//   npm run import:samsung -- <yol> --from 2026-09-12   -> o tarihten oncesini atar
//
// Ne alinir: gunluk adim, kilo, tansiyon ve anlamli egzersiz seanslari.
// Saat hareket adini (omuz/kol) arsive yazmiyor - yalniz seans tipi var; hareket
// listesi Samsung'dan gelmez, seans "bu neydi?" karti olarak onaya duser.
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
  // Tam eslesme: "…exercise" prefixi "…exercise.custom_exercise" dosyasini da yakalar.
  const wanted = new RegExp(`^${name.replace(/\./g, '\\.')}\\.\\d+\\.csv$`)
  const file = readdirSync(dir).find((f) => wanted.test(f))
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

/**
 * Arsivi okur, yazilacak kayitlari uretir. Saf: API'ye dokunmaz.
 * `from` verilirse o tarihten oncesi atlanir - Dean gunlugun baslangicini
 * 2026-09-12 olarak temizledi, arsiv yeniden calistirilinca 2024 geri gelmesin.
 */
// Samsung exercise_type -> bizim tip. Arsivde gozlenen kodlar:
//   1001  yuruyus (count = adim) - ALINMAZ: adim zaten gunluk sayacta, ayri
//         antrenman satiri gunde 2-4 kez gurultu yapardi
//   14001 yuzme (count = tur)
//   15002 salon/devre - tip tahmini, needs_review ile onaya duser
//   0     tanimsiz - yalniz 30 dk ustu alinir (kisasi gunluk hareket)
const EXERCISE_TYPES = {
  14001: { type: 'cardio', note: 'Yüzme (Samsung)' },
  15002: { type: 'resistance', note: 'Salon (Samsung, tip 15002)' },
}
const UNKNOWN_MIN_MINUTES = 30

// Saatte elle acilan ozel egzersiz: exercise_type 0 gelir, hareketi custom_id soyler
// (custom_exercise tablosunda adi var). Ad -> katalog id. Anahtarlar kucuk harf ve
// noktalama atilmis haliyle karsilastirilir, "Row-Pull" ile "row pull" ayni sayilir.
const CUSTOM_NAMES = {
  butterfly: 'Butterfly',
  rowpull: 'Leverage_Iso_Row',
  lateralrow: 'Leverage_Iso_Row',
  hipthrust: 'Barbell_Hip_Thrust',
  pallofpress: 'Pallof_Press',
  deadbug: 'Dead_Bug',
  calfpress: 'Calf_Press_On_The_Leg_Press_Machine',
  facepull: 'Face_Pull',
  tricepspushdown: 'Triceps_Pushdown',
}
const normalize = (name) => (name ?? '').toLowerCase().replace(/[^a-z]/g, '')

// Rutinden gelen hareket kodu -> apps/web/src/data/exercises.json id'si.
// Tam liste ve gerekcesi docs/SAAT-RUTIN.md. Burada olmayan kod set uretmez.
const EXERCISE_IDS = {
  10011: 'Machine_Bench_Press',
  10012: 'Hack_Squat',
  10013: 'Split_Squat_with_Dumbbells',
  10014: 'Leg_Press',
  10015: 'Leg_Extensions',
  10016: 'Seated_Leg_Curl',
  10018: 'Wide-Grip_Lat_Pulldown',
  10019: 'Romanian_Deadlift',
  10020: 'Leverage_Shoulder_Press',
  10022: 'Side_Lateral_Raise',
  10023: 'Ab_Crunch_Machine',
  10025: 'Plank',
  10026: 'Machine_Bicep_Curl',
  10027: 'Machine_Triceps_Extension',
  15003: 'Recumbent_Bike',
}

export function collect(dir, from = null) {
  const wearable = []
  const daily = new Map()
  const skip = (date) => from !== null && date < from
  const put = (date, field, value) => { if (!skip(date)) daily.set(date, { ...daily.get(date), [field]: value }) }
  const push = (date, metric, value) => { if (!skip(date)) wearable.push({ date, source: SOURCE, metric, value }) }

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

  // Egzersiz seanslari. id = Samsung'un datauuid'si: tekrar calistirma cogaltmaz.
  const E = 'com.samsung.health.exercise.'
  const workouts = []
  const rows = readTable(dir, 'com.samsung.shealth.exercise')

  // Ozel egzersiz adlari: custom_id -> katalog id.
  let customIds = new Map()
  try {
    customIds = new Map(
      readTable(dir, 'com.samsung.shealth.exercise.custom_exercise')
        .filter((r) => r.custom_id && CUSTOM_NAMES[normalize(r.custom_name)])
        .map((r) => [r.custom_id, CUSTOM_NAMES[normalize(r.custom_name)]]),
    )
  } catch {
    // Arsivde ozel egzersiz tablosu yoksa sorun degil.
  }

  // Rutinden baslatilan seans: her hareket ayri satir, routine_datauuid ile bagli
  // (docs/SAAT-RUTIN.md). Bunlar tek antrenman + set kayitlarina donusur.
  const byRoutine = new Map()
  for (const r of rows) {
    const routine = r.routine_datauuid
    if (!routine) continue
    if (!byRoutine.has(routine)) byRoutine.set(routine, [])
    byRoutine.get(routine).push(r)
  }

  for (const [routine, parts] of byRoutine) {
    parts.sort((a, b) => (a[`${E}start_time`] ?? '').localeCompare(b[`${E}start_time`] ?? ''))
    const first = parts[0]
    const date = localDay(first[`${E}start_time`], first[`${E}time_offset`])
    if (skip(date)) continue
    const sets = []
    const setNo = new Map()
    let minutes = 0
    for (const p of parts) {
      minutes += Math.round(Number(p[`${E}duration`] || 0) / 60000)
      // Ozel egzersiz once: type 0 ile gelir, custom_id olmadan dinlenme sayilir.
      const exerciseId = customIds.get(p.custom_id) ?? EXERCISE_IDS[Number(p[`${E}exercise_type`])]
      const reps = Number(p[`${E}count`])
      // exercise_type 0 = dinlenme araligi; katalogda karsiligi olmayan kod da atlanir.
      if (!exerciseId || !Number.isFinite(reps) || reps <= 0) continue
      const no = (setNo.get(exerciseId) ?? 0) + 1
      setNo.set(exerciseId, no)
      sets.push({
        id: p[`${E}datauuid`],
        exercise_id: exerciseId,
        set_no: Math.min(no, 20),
        // Agirlik Samsung'da yok; Dean uygulamada girer. count = toplam tekrar,
        // set kirilimi gelmedigi icin tek satir.
        weight_kg: null,
        reps: Math.min(reps, 100),
        done_at: new Date(Date.parse(`${p[`${E}end_time`].replace(' ', 'T')}Z`)).toISOString(),
      })
    }
    if (sets.length === 0) continue
    workouts.push({
      id: routine,
      date,
      type: 'resistance',
      duration_min: minutes,
      muscle_groups: [],
      needs_review: true,
      notes: `Saat rutini (${sets.length} set, ${new Set(sets.map((s) => s.exercise_id)).size} hareket)`,
      sets,
    })
  }

  // Rutinsiz seanslar: yalniz sure ve tip var.
  for (const r of rows) {
    if (r.routine_datauuid) continue
    const start = r[`${E}start_time`]
    if (!start) continue
    const date = localDay(start, r[`${E}time_offset`])
    if (skip(date)) continue
    const minutes = Math.round(Number(r[`${E}duration`] || 0) / 60000)
    const code = Number(r[`${E}exercise_type`])
    const known = EXERCISE_TYPES[code]
    if (!known && !(code === 0 && minutes >= UNKNOWN_MIN_MINUTES)) continue
    workouts.push({
      id: r[`${E}datauuid`],
      date,
      type: known?.type ?? 'cardio',
      duration_min: minutes,
      muscle_groups: [],
      // Ne yapildigini yalniz Dean bilir: onaylanana kadar "bu neydi?" karti.
      needs_review: true,
      notes: known?.note ?? `Samsung (tanımsız, ${minutes} dk)`,
    })
  }

  return {
    wearable,
    daily: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)),
    workouts: workouts.sort((a, b) => a.date.localeCompare(b.date)),
  }
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
  const fromIndex = args.indexOf('--from')
  const from = fromIndex >= 0 ? args[fromIndex + 1] : null
  const apiIndex = args.indexOf('--api')
  const api = apiIndex >= 0 ? args[apiIndex + 1] : 'http://127.0.0.1:3011'

  const { dir, cleanup } = openExport(path)
  let result
  try {
    result = collect(dir, from)
  } finally {
    cleanup()
  }

  const { wearable, daily, workouts } = result
  const days = daily.map(([date]) => date)
  console.log(`${days.length} gun  ${days[0]} -> ${days[days.length - 1]}`)
  console.log(`  olcum kaydi : ${wearable.length}`)
  console.log(`  antrenman   : ${workouts.length}`)
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
  // Seanslar: id = Samsung datauuid, tekrar calistirma uzerine yazar.
  for (const w of workouts) await send(api, token, 'POST', '/api/workouts', w)
  console.log(`\nyazildi. gunluk: ${written} gun dolduruldu, ${skipped} gun zaten doluydu. antrenman: ${workouts.length}`)
}
