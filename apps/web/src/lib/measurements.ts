import type { Measurement } from './db'

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
