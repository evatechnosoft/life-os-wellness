import type { Goals } from './settings'

/**
 * Telafi gunu (PLAN-DIET S1). Saf fonksiyon: saat okumaz, veri cekmez, cumle
 * kurmaz - `now` ve veriler disaridan gelir, cikti yapilandirilmis veridir.
 *
 * Tek kural her seyin ustunde: telafi KISITLAMA DEGILDIR. Burada uretilen hicbir
 * alan "az ye / ogun atla / oruc tut" anlamina gelemez; protein hedefi asla
 * dusurulmez (COACH-PERSONA §2.2 yeme bozuklugu bayragi). Telafi = rutine donus.
 */

/** Gunun kcal toplami 14 gunluk ortancanin bu yuzdesini gecerse aday sayilir. */
const KCAL_TRIGGER_PCT = 140

/** Bu kadar kcal'li gun yoksa ortanca gurultudur, tetik sessiz kalir. */
const MIN_KCAL_HISTORY = 4

/** Aclik skoru bu degerden yukarida yenmis ogun "cok ac karnina" sayilir (S3). */
const HIGH_HUNGER = 8

/** Adim artisi: 7-gun ortalamanin yuzdesi ve mutlak tavani. */
const STEPS_ADD_PCT = 15
const STEPS_ADD_CAP = 3000

/** Ayda bu kadar isaret birikince Eva bir kez, yumusak dille uzman onerir. */
const SUPPORT_THRESHOLD = 4

/** Aksam slotunun bitisi: bundan once plan bugunun kalan ogunune yazilir. */
const DAY_END_HOUR = 22

export type LapseTrigger = 'flag' | 'kcal' | 'hunger'

export interface LapseInput {
  /** Kullanicinin kendi isareti ("bugun abarttim"). Her zaman gecerlidir. */
  overate: boolean
  /** Gunun kcal toplami; kcal girilmemisse null ve tetik 2 sessizdir. */
  kcal_today: number | null
  /** Onceki 14 gunun kcal toplamlari - yalniz kcal girilmis gunler. */
  kcal_history: number[]
  /** O gun kaydedilmis aclik skorlari (1-10). */
  hunger_scores: number[]
  /** Gunun protein hedefi. Cikti bunu aynen tasir, asla dusurmez. */
  protein_target_g: number
  /** 7-gun ortalama adim; bilinmiyorsa null. */
  avg_steps: number | null
  /** Bu hafta abartilan gun sayisi, bu gun dahil. */
  overate_days_this_week: number
  /** Bu ay abartilan gun sayisi, bu gun dahil. */
  overate_days_this_month: number
  /** Uzman onerisi bu ay zaten gosterildi mi - bir kez gosterilir. */
  support_shown: boolean
  /** Planli serbest ogun gunu mu (S7): planliysa telafi cikmaz, ceza yok. */
  free_meal_planned: boolean
  /** Yerel saat, HH:MM. */
  now: string
}

export interface RecoveryPlan {
  kind: 'recovery'
  /** Hangi tetik(ler) calisti - UI gerekceyi buradan kurar, uydurmaz. */
  triggers: LapseTrigger[]
  /** Hafta bazinda bakis: tek gun dengeli bir haftayi bozmaz. */
  week_status: 'on_track' | 'slight' | 'reset'
  /** Plan bugunun kalan ogunune mi, yarina mi yaziliyor. */
  applies_to: 'today' | 'tomorrow'
  /** Hedef DEGISMEZ, tam alinir. */
  protein_g: number
  steps_add: number
  fiber_servings: number
  /** Literal: ogun atlamak yok. UI bunu vurgular. */
  no_skip_meals: true
  /** Yarinki tarti su/glikojen tasir, bilgi vermez. */
  next_weigh_in: 'skip_tomorrow'
  /** Ayda 4+ isaret: bir kez, yumusak dille uzman destegi onerisi. */
  refer_support: boolean
  severity: 'info'
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length / 2
  return sorted.length % 2 === 1
    ? sorted[Math.floor(mid)]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function triggersOf(input: LapseInput): LapseTrigger[] {
  const hits: LapseTrigger[] = []
  if (input.overate) hits.push('flag')

  const base = input.kcal_history.length >= MIN_KCAL_HISTORY ? median(input.kcal_history.slice(-14)) : null
  if (input.kcal_today != null && base != null && input.kcal_today > (base * KCAL_TRIGGER_PCT) / 100) {
    hits.push('kcal')
  }

  if (input.hunger_scores.filter((h) => h >= HIGH_HUNGER).length >= 2) hits.push('hunger')
  return hits
}

/**
 * Telafi plani. Tetik yoksa null doner - "her ihtimale karsi" plan uretmez.
 * Planli serbest ogun gununde de null: planlanmis bir sey telafi gerektirmez.
 */
export function recoveryPlan(input: LapseInput): RecoveryPlan | null {
  if (input.free_meal_planned) return null
  const triggers = triggersOf(input)
  if (triggers.length === 0) return null

  const steps_add =
    input.avg_steps == null || input.avg_steps <= 0
      ? 0
      : Math.min(Math.round((input.avg_steps * STEPS_ADD_PCT) / 100 / 100) * 100, STEPS_ADD_CAP)

  const week = input.overate_days_this_week
  const week_status = week >= 3 ? 'reset' : week === 2 ? 'slight' : 'on_track'

  return {
    kind: 'recovery',
    triggers,
    week_status,
    // Ayni gun icinde bir sonraki ogunu hafifletmek ertesi gune yaymaktan daha
    // olasi (PLAN-DIET §5.2); gun bittiyse plan yarina yazilir.
    applies_to: Number(input.now.slice(0, 2)) < DAY_END_HOUR ? 'today' : 'tomorrow',
    protein_g: input.protein_target_g,
    steps_add,
    fiber_servings: 5,
    no_skip_meals: true,
    next_weigh_in: 'skip_tomorrow',
    refer_support: input.overate_days_this_month >= SUPPORT_THRESHOLD && !input.support_shown,
    severity: 'info',
  }
}

/**
 * Itme dozu (S2b). Ayardan bir deger secildiyse o sabittir; secilmediyse adaptif:
 * telafi gunu `push`, diger gunler `soft`. Karar 2026-09-17, Dean.
 */
export function nudgeFor(goals: Pick<Goals, 'nudge'>, recovery: RecoveryPlan | null): 'soft' | 'push' {
  if (goals.nudge) return goals.nudge
  return recovery ? 'push' : 'soft'
}
