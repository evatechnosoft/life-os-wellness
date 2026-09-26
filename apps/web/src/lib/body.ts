import { daysBetween } from './date'
import type { WearableRecord } from './db'
import { leanMassKg } from './nutrition'

/** Bir tartinin vucut kompozisyonu. Olmayan olcum null - tahmin yok. */
export interface BodyPoint {
  date: string
  weight: number | null
  fat_kg: number | null
  fat_pct: number | null
  lean_kg: number | null
  skeletal_kg: number | null
  visceral: number | null
}

type Change = Record<'fat_kg' | 'lean_kg' | 'skeletal_kg' | 'visceral', number | null>

export interface BodySummary {
  latest: BodyPoint
  /** Pencere icindeki ilk tarti; tek tarti varsa latest ile ayni. */
  base: BodyPoint
  days: number
  change: Change | null
}

/** Kompozisyon karar birimi 28 gun: BIA tek olcumde sallanir, gunluk fark gurultu. */
export const BODY_WINDOW_DAYS = 28

const COMPOSITION = ['body_fat_kg', 'body_fat_pct', 'skeletal_muscle_kg', 'visceral_fat']
/** Raporun okudugu wearable metrikleri. */
export const BODY_METRICS = ['weight_kg', ...COMPOSITION]

const round1 = (n: number): number => Math.round(n * 10) / 10

/**
 * OKOK tartisindan tarih basina bir nokta. Yalniz `source === 'okok'` satirlari:
 * Samsung da ayni gune body_fat_kg/skeletal_muscle_kg yaziyor, id `${date}:${metric}`
 * cakistigi icin son sync digerini eziyor ve Samsung BIA 3-4 kg farkli okuyor. Id'den
 * kaynak secilemez; eldeki satirin kaynagina bakilir, Samsung'un ezdigi gun duser.
 * Tartida kilo yoksa daily_log kilosu kullanilir.
 */
export function bodySeries(
  rows: WearableRecord[],
  weightOn: Record<string, number | null | undefined>,
): BodyPoint[] {
  const byDate = new Map<string, Record<string, number>>()
  for (const r of rows) {
    if (r.source !== 'okok') continue
    byDate.set(r.date, { ...byDate.get(r.date), [r.metric]: r.value })
  }
  return [...byDate.entries()]
    .filter(([, m]) => COMPOSITION.some((k) => m[k] != null))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, m]) => {
      const weight = m.weight_kg ?? weightOn[date] ?? null
      const fat = m.body_fat_kg ?? null
      return {
        date,
        weight,
        fat_kg: fat,
        fat_pct: m.body_fat_pct ?? null,
        lean_kg: fat == null ? null : leanMassKg([{ date, value: fat }], { [date]: weight }),
        skeletal_kg: m.skeletal_muscle_kg ?? null,
        visceral: m.visceral_fat ?? null,
      }
    })
}

/**
 * Son tarti ile 28 gunluk penceredeki ilk tartinin farki. Pencere son tartiya
 * dayanir, bugune degil: tartiya bir hafta cikilmasa da rapor bos kalmaz.
 * ponytail: uc-uca fark tek kotu olcume duyarli; seyrek tartida yeterli, gunluk
 * tartiya gecilirse ilk/son hafta ortancasi karsilastirilir.
 */
export function bodySummary(series: BodyPoint[]): BodySummary | null {
  const latest = series.at(-1)
  if (!latest) return null
  const base = series.find((p) => daysBetween(p.date, latest.date) < BODY_WINDOW_DAYS)!
  const diff = (k: keyof Change): number | null => {
    const a = base[k]
    const b = latest[k]
    return a == null || b == null ? null : round1(b - a)
  }
  return {
    latest,
    base,
    days: daysBetween(base.date, latest.date),
    change:
      base === latest
        ? null
        : { fat_kg: diff('fat_kg'), lean_kg: diff('lean_kg'), skeletal_kg: diff('skeletal_kg'), visceral: diff('visceral') },
  }
}

const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** "+0,6" / "−1,0" - gercek eksi isareti, rakamlar hizali kalsin. */
export function signed(n: number): string {
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${nf1.format(Math.abs(n))}`
}

/** Esikler BIA gurultusunun ustunde: yag 0,3 kg, kas 0,5 kg. */
export function bodyText(s: BodySummary): string {
  if (!s.change) return `Değişim için ${BODY_WINDOW_DAYS} gün içinde ikinci bir tartı gerekiyor.`
  const parts: string[] = []
  const fat = s.change.fat_kg
  if (fat != null) parts.push(Math.abs(fat) < 0.3 ? 'yağ sabit' : `yağ ${signed(fat)} kg`)
  // Iskelet kasi tartidan dogrudan gelir; yoksa kilo - yag.
  const muscle = s.change.skeletal_kg ?? s.change.lean_kg
  if (muscle != null) parts.push(Math.abs(muscle) < 0.5 ? 'kas korunuyor' : `kas ${signed(muscle)} kg`)
  return parts.length === 0 ? 'Karşılaştırılacak ölçüm yok.' : `${s.days} günde ${parts.join(', ')}.`
}
