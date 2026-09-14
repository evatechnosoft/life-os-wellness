import { daysBetween } from './date'
import type { Workout } from './db'
import { setsByMuscle } from './metrics'
import type { Goals } from './settings'
import { groupsFor, type Split } from './split'

/**
 * Antrenman kocu: kural motoru, model degil. Her fonksiyon saftir - saat okumaz,
 * `Date.now()` cagirmaz - ve Turkce cumle degil VERI dondurur; cumleyi ekran ya
 * da Eva yazar. Boylece ayni oneri hem kartta hem sohbet baglaminda kullanilir.
 */
export type CoachTip =
  | { kind: 'volume_low'; muscle: string; sets: number; target: number; add: number; severity: 'info' }
  | { kind: 'volume_high'; muscle: string; sets: number; cap: number; severity: 'info' }
  | { kind: 'volume_none'; muscle: string; severity: 'warn' }
  | { kind: 'progress_weight'; muscle: string; from_kg: number; to_kg: number; severity: 'info' }
  | { kind: 'progress_reps'; muscle: string; reps: number; to_reps: number; severity: 'info' }
  | { kind: 'progress_sets'; muscle: string; sets: number; target: number; severity: 'info' }
  | { kind: 'stall'; muscle: string; sessions: number; severity: 'warn' }
  | { kind: 'no_data'; muscle: string; severity: 'info' }
  | { kind: 'deload'; reason: 'buildup' | 'decline'; weeks: number; severity: 'warn' }
  | TodayTip

/** Bugunun bolgesi ayri tip: ekran bunu her zaman gosterir, oneri olmasa da. */
export interface TodayTip {
  kind: 'today'
  groups: string[]
  logged: boolean
  severity: 'info'
}

/**
 * AZALAN VERIM ESIGI - kanitlanmis bir ust sinir DEGIL. 67 calisma / 2058 kisilik
 * meta-regresyonda hacim arttikca hipertrofi ve kuvvet artmaya devam ediyor; 20
 * setin ustunde kazancin dustugune ya da zarar verdigine dair bulgu yok, yalniz
 * her ek setin getirisi kuculuyor (Pelland ve ark., Sports Medicine 2025).
 * Bu yuzden asilmasi `warn` degil `info`: bilgi, suclama degil.
 */
const HYPERTROPHY_MAX_SETS = 20

/**
 * Haftanin set hacmini hedefle karsilastirir. `workouts` cagiranin sectigi
 * hafta penceresidir; `split` plandaki ama hafta boyu hic dokunulmamis grubu
 * ayirmak icin gerekir - sifir set, "az calistim"dan baska bir sorundur.
 */
export function volumeTips(workouts: Workout[], goals: Goals, split: Split): CoachTip[] {
  const totals = setsByMuscle(workouts)
  const planned = [...new Set(Object.values(split).flat())].sort()
  const cap = Math.max(goals.sets_per_group, HYPERTROPHY_MAX_SETS)

  const untouched: CoachTip[] = planned
    .filter((muscle) => (totals[muscle] ?? 0) === 0)
    .map((muscle) => ({ kind: 'volume_none', muscle, severity: 'warn' }))

  const volume: CoachTip[] = Object.entries(totals)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([muscle, sets]): CoachTip[] => {
      if (sets < goals.sets_per_group) {
        return [{ kind: 'volume_low', muscle, sets, target: goals.sets_per_group, add: goals.sets_per_group - sets, severity: 'info' }]
      }
      if (sets > cap) return [{ kind: 'volume_high', muscle, sets, cap, severity: 'info' }]
      return []
    })

  return [...untouched, ...volume]
}

/**
 * Tekrar araliginin ust ucu. Double progression: tekrar bu sayiyi asana kadar
 * tekrar artar, astiginda agirlik artar ve tekrar aralığin altina doner.
 * Bu bir uygulama kuralidir, kanitla dogrulanmis bir esik degil: ilerlemeyi
 * yoneten sey tekrar sayisi degil sete konan efordur (0-2 RIR).
 */
const REP_TARGET_MAX = 12

/** Alt govde daha buyuk mutlak artisi tasir; ust govde kucuk adimla ilerler. Salon uygulamasi, kanit degil. */
const LOWER_BODY = new Set(['bacak', 'kalça', 'baldır'])
const WEIGHT_STEP = { upper: 0.025, lower: 0.05 }

/** Uc seanstir hicbir sey artmadiysa program durmustur, yuk degil plan degisir. */
const STALL_SESSIONS = 3

interface Session {
  date: string
  weight: number
  sets: number
  /** Set basina tekrar - toplam tekrar, set sayisi degisince kiyaslanamaz. */
  reps: number
}

function nextWeight(muscle: string, weight: number): number {
  const step = LOWER_BODY.has(muscle) ? WEIGHT_STEP.lower : WEIGHT_STEP.upper
  // toFixed once: 60 * 1.025 kayan noktada 61.4999... cikar ve asagi yuvarlanir.
  const raised = Math.round(Number((weight * (1 + step)).toFixed(4)))
  // Kucuk agirlikta yuzde, yuvarlamada sifira duser; artis her zaman gercek olsun.
  return Math.max(raised, weight + 1)
}

function sessionsByMuscle(workouts: Workout[]): Map<string, Session[]> {
  const byMuscle = new Map<string, Session[]>()
  for (const w of workouts) {
    if (w.type !== 'resistance') continue
    for (const muscle of w.muscle_groups) {
      const list = byMuscle.get(muscle) ?? []
      if (typeof w.weight_kg === 'number' && w.sets_total && typeof w.reps_total === 'number') {
        list.push({ date: w.date, weight: w.weight_kg, sets: w.sets_total, reps: w.reps_total / w.sets_total })
      }
      byMuscle.set(muscle, list)
    }
  }
  for (const list of byMuscle.values()) list.sort((a, b) => a.date.localeCompare(b.date))
  return byMuscle
}

/** Son uc seansta agirlik, tekrar ve set basliklarindan hicbiri yukselmemis mi. */
function isStalled(sessions: Session[]): boolean {
  if (sessions.length < STALL_SESSIONS) return false
  const recent = sessions.slice(-STALL_SESSIONS)
  return recent.every((s, i) => {
    const prev = recent[i - 1]
    return prev === undefined || (s.weight <= prev.weight && s.reps <= prev.reps && s.sets <= prev.sets)
  })
}

/**
 * Double progression: ayni agirlikta tekrar araligin ustune ciktiysa agirlik,
 * cikmadiysa tekrar artar; ikisi de soylenemiyorsa eksik olan haftalik settir.
 * Agirlik hic girilmemisse oneri uretilmez - tahmin, veri yoklugunu gizler.
 * `now` disaridan gelir (saf fonksiyon); haftalik pencere ona gore hesaplanir.
 */
export function progressTips(workouts: Workout[], goals: Goals, now: string): CoachTip[] {
  const weekly = setsByMuscle(workouts.filter((w) => {
    const age = daysBetween(w.date, now)
    return age >= 0 && age < 7
  }))

  return [...sessionsByMuscle(workouts).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([muscle, sessions]): CoachTip[] => {
      const last = sessions[sessions.length - 1]
      if (last === undefined) return [{ kind: 'no_data', muscle, severity: 'info' }]
      const prev = sessions[sessions.length - 2]
      const weekSets = weekly[muscle] ?? 0

      const action: CoachTip[] =
        prev !== undefined && prev.weight === last.weight && last.reps > REP_TARGET_MAX
          ? [{ kind: 'progress_weight', muscle, from_kg: last.weight, to_kg: nextWeight(muscle, last.weight), severity: 'info' }]
          : prev !== undefined && prev.weight === last.weight
            ? [{ kind: 'progress_reps', muscle, reps: Math.round(last.reps), to_reps: Math.round(last.reps) + 1, severity: 'info' }]
            : weekSets < goals.sets_per_group
              ? [{ kind: 'progress_sets', muscle, sets: weekSets, target: goals.sets_per_group, severity: 'info' }]
              : []

      return isStalled(sessions)
        ? [...action, { kind: 'stall', muscle, sessions: STALL_SESSIONS, severity: 'warn' }]
        : action
    })
}

/**
 * Kesintisiz artisin hafif hafta onerisine donustugu hafta sayisi. 4-8 hafta bir
 * UYGULAMA GELENEGI; planli deload'un kaniti zayif ve ihtiyac yokken yapilani
 * kuvvete zarar verebiliyor (Coleman ve ark., PeerJ 2024). O yuzden oneri
 * "zorundasin" degil "toparlanma gerekiyorsa" tonundadir; asil savunulabilir
 * sinyal reaktif olan (`decline`).
 */
const DELOAD_AFTER_WEEKS = 5
/** Ust uste dusen hafta sayisi: iki dusus tesaduf degil, toparlanma borcudur. */
const DECLINE_WEEKS = 3

/** Haftalik tonaj: set x agirlik. Agirlik girilmemisse set sayisi tek basina sayilir. */
function weeklyVolume(workouts: Workout[], now: string, weeks: number): number[] {
  const buckets = new Array<number>(weeks).fill(0)
  for (const w of workouts) {
    if (w.type !== 'resistance' || !w.sets_total) continue
    const age = daysBetween(w.date, now)
    if (age < 0) continue
    const bucket = Math.floor(age / 7)
    if (bucket < weeks) buckets[bucket] = buckets[bucket]! + w.sets_total * (w.weight_kg ?? 1)
  }
  return buckets
}

/** buckets[0] en yeni hafta; artis eskiden yeniye dogru okunur. */
function rising(buckets: number[]): boolean {
  return buckets.every((v, i) => v > 0 && (i === 0 || v < buckets[i - 1]!))
}

/**
 * Hafif hafta sinyali: ya uzun kesintisiz artis birikmistir, ya da performans
 * ust uste dusmustur - ikisi de ayni cozumu ister. Eksik hafta zinciri kirar:
 * zaten dinlenilmis bir bloga deload eklemek antrenmani bosa harcar.
 */
export function deloadTip(workouts: Workout[], now: string): CoachTip | null {
  const buckets = weeklyVolume(workouts, now, DELOAD_AFTER_WEEKS)
  if (rising(buckets)) return { kind: 'deload', reason: 'buildup', weeks: DELOAD_AFTER_WEEKS, severity: 'warn' }
  const recent = buckets.slice(0, DECLINE_WEEKS)
  if (rising([...recent].reverse())) return { kind: 'deload', reason: 'decline', weeks: DECLINE_WEEKS, severity: 'warn' }
  return null
}

/** Bugunun planlanan bolgesi ve o gune kayit girilip girilmedigi. */
export function todayFocus(split: Split, workouts: Workout[], today: string): TodayTip {
  return {
    kind: 'today',
    groups: groupsFor(split, today),
    logged: workouts.some((w) => w.date === today),
    severity: 'info',
  }
}

/**
 * Butun kurallarin tek listesi. Hacim yalniz son yedi gune bakar - "bu hafta
 * ne yaptim" sorusu bu; ilerleme ve deload daha uzun gecmise ihtiyac duyar,
 * o yuzden `workouts` cagirandan olabildigince genis gelir.
 */
export function coachTips(workouts: Workout[], goals: Goals, split: Split, today: string): CoachTip[] {
  const thisWeek = workouts.filter((w) => {
    const age = daysBetween(w.date, today)
    return age >= 0 && age < 7
  })
  const deload = deloadTip(workouts, today)
  return [
    ...volumeTips(thisWeek, goals, split),
    ...progressTips(workouts, goals, today),
    ...(deload ? [deload] : []),
    todayFocus(split, workouts, today),
  ]
}
