import type { DailyLog, Measurement } from './db'

/**
 * Gun ici coklu olcumden gunun tek degerini cikarir.
 *
 * Neden sabah: 23 Eyl'de ayni gun alinan uc tansiyondan ikisi 6 dakika arayla
 * 134/90 ve 128/78 cikti; gun ici olcum kahve, hareket ve seansla oynuyor.
 * Sabah olcumu (kalkinca, ac karnina, antrenmandan once) gunler arasinda
 * karsilastirilabilir tek olcum - trend kararini o tasiyor.
 *
 * Sabah olcumu yoksa gun tamamen kaybolmasin diye gunun butun olcumlerinin
 * ortalamasi doner; cagiran taraf `morning` alanina bakip ayirt edebilir.
 */
export const MORNING_UNTIL = '11:00'

export interface DayValue {
  bp_systolic: number | null
  bp_diastolic: number | null
  pulse: number | null
  weight_kg: number | null
  /** Deger sabah olcumlerinden mi geldi - trend kararinda agirligi bu belirler. */
  morning: boolean
  count: number
}

const mean = (values: number[]): number | null =>
  values.length === 0 ? null : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10

const pick = (rows: Measurement[], field: 'bp_systolic' | 'bp_diastolic' | 'pulse' | 'weight_kg'): number | null =>
  mean(rows.map((r) => r[field]).filter((v): v is number => v != null))

export function dayValue(rows: Measurement[]): DayValue | null {
  if (rows.length === 0) return null
  const morning = rows.filter((r) => r.time <= MORNING_UNTIL)
  const used = morning.length > 0 ? morning : rows
  return {
    bp_systolic: pick(used, 'bp_systolic'),
    bp_diastolic: pick(used, 'bp_diastolic'),
    pulse: pick(used, 'pulse'),
    // Kilo sabahla sinirli degil: gun ici tartilmadiysa aksam olcumu de gunun kilosu.
    weight_kg: pick(rows, 'weight_kg'),
    morning: morning.length > 0,
    count: used.length,
  }
}

/** Tansiyon satiri: "128/78 (2 sabah ölçümü)" gibi tek satirlik ozet. */
export function summary(value: DayValue | null): string {
  if (value === null) return 'ölçüm yok'
  const parts: string[] = []
  if (value.bp_systolic != null && value.bp_diastolic != null) {
    parts.push(`${Math.round(value.bp_systolic)}/${Math.round(value.bp_diastolic)}`)
  }
  if (value.pulse != null) parts.push(`${Math.round(value.pulse)} bpm`)
  if (value.weight_kg != null) parts.push(`${value.weight_kg} kg`)
  const kind = value.morning ? 'sabah' : 'gün içi'
  return parts.length === 0 ? 'ölçüm yok' : `${parts.join(' · ')} (${value.count} ${kind} ölçümü)`
}

type DailyFields = Pick<DailyLog, 'bp_systolic' | 'bp_diastolic' | 'weight_kg'>

/**
 * Gunun olcumlerinden daily_log'a yazilacak fark. Trend ve 7 gun ortalamasi daily_log'u
 * okur; olcum nereden gelirse gelsin (uygulama, sohbet) gunun degeri burada tek kurala
 * baglanir. Degismeyen alan yazilmaz, olcum yoksa daily_log'a dokunulmaz.
 * `onlyEmpty`: sunucudan cekerken yalniz bos alan doldurulur. 26 Eyl'de gunun tek olcumu
 * aksamdi (119/71); tam kural sohbetten yazilan sabah kolluk degerini (114/74) ezerdi.
 */
export function dailyPatch(
  rows: Measurement[],
  log: Partial<DailyFields> | undefined,
  onlyEmpty = false,
): Partial<DailyFields> {
  const value = dayValue(rows)
  if (value === null) return {}
  const next: Partial<DailyFields> = {}
  if (value.bp_systolic != null) next.bp_systolic = Math.round(value.bp_systolic)
  if (value.bp_diastolic != null) next.bp_diastolic = Math.round(value.bp_diastolic)
  if (value.weight_kg != null) next.weight_kg = value.weight_kg
  const patch: Partial<DailyFields> = {}
  for (const [k, v] of Object.entries(next) as [keyof DailyFields, number][]) {
    if (log?.[k] == null || (!onlyEmpty && Number(log[k]) !== v)) patch[k] = v
  }
  return patch
}
