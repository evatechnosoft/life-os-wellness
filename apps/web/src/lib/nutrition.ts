import type { Meal } from './db'
import { foodMemory } from './metrics'
import type { Goals } from './settings'

/**
 * Beslenme kocu: tamami saf fonksiyon, I/O yok, LLM yok. Cikti yapilandirilmis
 * veridir - cumleyi UI ve Eva kurar. Kalori/besin veritabani kapsam disi
 * (AGENTS.md kilidi): burada yalniz protein grami vardir.
 */

export type MealSlot = 'morning' | 'noon' | 'evening' | 'snack'
export type Severity = 'info' | 'warn'

/** Slot sinirlari: [baslangic saati, bitis saati). Disinda kalan her saat atistirmaliktir. */
const SLOT_HOURS: Record<Exclude<MealSlot, 'snack'>, [number, number]> = {
  morning: [5, 11],
  noon: [11, 16],
  evening: [16, 22],
}

const MAIN_SLOTS: Exclude<MealSlot, 'snack'>[] = ['morning', 'noon', 'evening']

/** Direnc antrenmani yapan biri icin etkili protein araligi, vucut agirligi basina. */
const G_PER_KG = { min: 1.6, max: 2.2, maintain: 1.8 } as const

/** Kas protein sentezi ogun basina ~0.4 g/kg ile doygunlasir; gunluk toplami tek ogune yigmak bunu kacirir. */
const PER_SLOT_G_PER_KG = 0.4

/**
 * Hedef ne olursa olsun asilmamasi gereken haftalik kayip: vucut agirliginin %1'i.
 * Ustunde yagsiz kutle ve kuvvet kaybi riski artar (Garthe 2011 · Helms 2014).
 */
const MAX_WEEKLY_LOSS_PCT = 1

/**
 * Haftalik kayip hedefinin bu haftaki kilogram karsiligi. Hedef yuzdedir; ayni
 * yuzde 60 ve 110 kiloda farkli kilogram demektir. Eski kg ayari kayitliysa
 * (goc yolu, `settings.ts`) o aynen kullanilir - kullanicinin kaydettigi hedef
 * kendiliginden degismez.
 */
export function weeklyLossKg(goals: Goals, avgWeightKg: number | null): number {
  if (goals.weekly_weight_loss_kg != null) return goals.weekly_weight_loss_kg
  if (avgWeightKg == null || avgWeightKg <= 0) return 0
  return Number(((avgWeightKg * goals.weekly_loss_pct) / 100).toFixed(2))
}

function hourOf(time: string): number {
  return Number(time.slice(0, 2))
}

export function mealSlot(time: string): MealSlot {
  const hour = hourOf(time)
  for (const slot of MAIN_SLOTS) {
    const [start, end] = SLOT_HOURS[slot]
    if (hour >= start && hour < end) return slot
  }
  return 'snack'
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length / 2
  // Ortanca: bir kez yanlis girilen porsiyon butun oneriyi kaydirmasin.
  return sorted.length % 2 === 1
    ? sorted[Math.floor(mid)]!
    : Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 10) / 10
}

export interface ProteinTarget {
  kind: 'protein_target'
  min_g: number
  max_g: number
  recommended_g: number
  current_goal_g: number
  /** Onerilen - kayitli hedef. Ayari EZMEZ, yalniz farki bildirir. */
  delta_g: number
  severity: Severity
}

/**
 * Protein hedefi 7-gun ortalama kilodan turetilir (gunluk kilo degil - AGENTS.md kilidi).
 * Kalori aciginda araligin ust ucu onerilir: acikta protein kas korur.
 */
export function proteinTarget(avgWeightKg: number | null, goals: Goals): ProteinTarget | null {
  if (avgWeightKg == null || avgWeightKg <= 0) return null
  const min_g = Math.round(avgWeightKg * G_PER_KG.min)
  const max_g = Math.round(avgWeightKg * G_PER_KG.max)
  const cutting = weeklyLossKg(goals, avgWeightKg) > 0
  const recommended_g = Math.round(avgWeightKg * (cutting ? G_PER_KG.max : G_PER_KG.maintain))
  const current_goal_g = goals.protein_g
  return {
    kind: 'protein_target',
    min_g,
    max_g,
    recommended_g,
    current_goal_g,
    delta_g: recommended_g - current_goal_g,
    severity: current_goal_g < min_g || current_goal_g > max_g ? 'warn' : 'info',
  }
}

export interface SlotGap {
  kind: 'slot_gap'
  slot: MealSlot
  consumed_g: number
  target_g: number
  gap_g: number
  /** Slot henuz gelmediyse bu bir kacirilmis ogun degil, gunun kalan plani. */
  upcoming: boolean
  severity: Severity
}

/**
 * Bugunun ogunlerini slotlara dagitip acik kalan slotlari dondurur.
 *
 * Uc ana slot x 0.4 g/kg yalnizca 1.2 g/kg eder; gunluk hedef bunun ustundedir ve
 * kaynak zaten **en az dort ogun** ister (Schoenfeld & Aragon 2018). O yuzden
 * atistirmalik dorduncu ogundur ve gunluk hedeften artan gramı tasir: "uc ogunu
 * tamamladin" demek gunu tamamladin demek degildir. Slot hedeflerini buyutmek
 * yerine dorduncu slota hedef verildi - 0.4-0.55 g/kg araligi ogun basina
 * korunsun diye.
 */
export function slotGaps(
  todayMeals: Meal[],
  avgWeightKg: number | null,
  goals: Goals,
  now: string,
): SlotGap[] {
  const target_g =
    avgWeightKg != null && avgWeightKg > 0
      ? Math.round(avgWeightKg * PER_SLOT_G_PER_KG)
      : Math.round(goals.protein_g / MAIN_SLOTS.length)
  const nowHour = hourOf(now)
  const consumedIn = (slot: MealSlot): number =>
    todayMeals.filter((m) => mealSlot(m.time) === slot).reduce((sum, m) => sum + (m.protein_g ?? 0), 0)

  const gaps: SlotGap[] = []
  for (const slot of MAIN_SLOTS) {
    const consumed_g = consumedIn(slot)
    const gap_g = Math.round(target_g - consumed_g)
    if (gap_g <= 0) continue
    const upcoming = nowHour < SLOT_HOURS[slot][0]
    gaps.push({ kind: 'slot_gap', slot, consumed_g, target_g, gap_g, upcoming, severity: upcoming ? 'info' : 'warn' })
  }

  // Atistirmaligin saat sinirlari yok: kacirilmis bir ogun degil, gunun kalani.
  const snack_target = goals.protein_g - target_g * MAIN_SLOTS.length
  if (snack_target > 0) {
    const consumed_g = consumedIn('snack')
    const gap_g = Math.round(snack_target - consumed_g)
    if (gap_g > 0) {
      gaps.push({
        kind: 'slot_gap',
        slot: 'snack',
        consumed_g,
        target_g: snack_target,
        gap_g,
        upcoming: false,
        severity: 'info',
      })
    }
  }
  return gaps
}

export interface FoodSuggestion {
  kind: 'food'
  slot: MealSlot
  food: string
  /** Gecmiste "200 g tavuk" gibi yazildiysa tipik gramaj, yoksa null. */
  grams: number | null
  /** "6 yumurta beyazi" gibi adetle yazilan porsiyonlar icin adet. */
  count: number | null
  protein_g: number
  times: number
  source: 'history' | 'seed'
  severity: Severity
}

/**
 * Veri azken kullanilan tohum listesi - yalnizca protein grami tasir, kalori ve
 * mikro besin yoktur (AGENTS.md: besin veritabani kapsam disi). Gecmis veri
 * geldiginde ogrenilen degerler bunun onune gecer.
 */
/**
 * "Tavuk Gogsu" ile "tavuk gogsu" ayni yiyecek. Kullanicinin yazimi korunur
 * (ekranda o gorunur), eslestirme bu katlanmis biçim uzerinden yapilir - yoksa
 * ogrenilen kalem tohum listesindeki esini bastiramaz ve ayni sey iki kez onerilir.
 */
export function foldTr(name: string): string {
  const map: Record<string, string> = { ı: 'i', İ: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c' }
  return name
    .trim()
    .toLowerCase()
    .replace(/[ıİşğüöç]/g, (c) => map[c] ?? c)
}

export const SEED_FOODS: { name: string; grams: number; protein_g: number; slots: MealSlot[] }[] = [
  { name: 'yumurta beyazı', grams: 200, protein_g: 22, slots: ['morning', 'snack'] },
  { name: 'süzme peynir', grams: 150, protein_g: 17, slots: ['morning', 'snack'] },
  { name: 'lor peyniri', grams: 150, protein_g: 20, slots: ['morning', 'snack'] },
  { name: 'yoğurt', grams: 250, protein_g: 9, slots: ['morning', 'snack'] },
  { name: 'tavuk göğsü', grams: 200, protein_g: 62, slots: ['noon', 'evening'] },
  { name: 'kırmızı et', grams: 200, protein_g: 52, slots: ['noon', 'evening'] },
  { name: 'hindi göğsü', grams: 200, protein_g: 58, slots: ['noon', 'evening'] },
  { name: 'ton balığı', grams: 160, protein_g: 42, slots: ['noon', 'snack'] },
  { name: 'fasulye', grams: 250, protein_g: 23, slots: ['evening'] },
  { name: 'mercimek', grams: 250, protein_g: 23, slots: ['noon', 'evening'] },
]

/**
 * "200 g tavuk" -> gramaj, "6 yumurta beyazi" -> adet. Birimsiz sayi gramaj
 * sayilmaz; 6 yumurta 6 gram degildir.
 */
function parsePortion(note: string): { name: string; grams: number | null; count: number | null } {
  const match = /^(\d+(?:[.,]\d+)?)\s*(?:(g|gr|gram)\b\.?)?\s*(.+)$/.exec(note.trim())
  if (!match) return { name: note.trim(), grams: null, count: null }
  const amount = Number(match[1]!.replace(',', '.'))
  const name = match[3]!.trim()
  return match[2] ? { name, grams: amount, count: null } : { name, grams: null, count: amount }
}

/** Ismi porsiyondan ayrilmis kopya - foodMemory ayni yiyecegi tek kayitta toplasin diye. */
function normalized(meals: Meal[]): Meal[] {
  return meals.map((m) => (m.note ? { ...m, note: parsePortion(m.note).name } : m))
}

function portionOf(meals: Meal[], name: string): { grams: number | null; count: number | null } {
  const parsed = meals.map((m) => parsePortion(m.note ?? '')).filter((p) => p.name === name)
  return {
    grams: median(parsed.map((p) => p.grams).filter((g): g is number => g != null)),
    count: median(parsed.map((p) => p.count).filter((c): c is number => c != null)),
  }
}

/**
 * Eksik slot icin somut oneri: o slotta gecmiste yenmis, protein yogunlugu yuksek
 * ve sik onaylanmis yiyecekler once. Son gunlerde cok gecen yiyecek cesitlilik
 * icin geri plana atilir; hic yenmemis bir sey ancak slot bos kalirsa (tohum
 * listesi) onerilir.
 */
export function suggestFoods(
  meals: Meal[],
  slot: MealSlot,
  opts: { recentMeals?: Meal[]; limit?: number } = {},
): FoodSuggestion[] {
  const limit = opts.limit ?? 3
  const inSlot = meals.filter((m) => mealSlot(m.time) === slot)
  const recentCounts = new Map<string, number>()
  for (const m of opts.recentMeals ?? []) {
    if (!m.note) continue
    const name = parsePortion(m.note).name
    recentCounts.set(name, (recentCounts.get(name) ?? 0) + 1)
  }

  const learned = foodMemory(normalized(inSlot), 20)
    .map((f) => ({
      food: f,
      // Protein x onay sayisi; son gunlerde tekrarlanan her kayit puani yariya yakin dusurur.
      score: (f.protein_g * (1 + f.times)) / (1 + 2 * (recentCounts.get(f.name) ?? 0)),
    }))
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .slice(0, limit)
    .map(({ food }): FoodSuggestion => ({
      kind: 'food',
      slot,
      food: food.name,
      ...portionOf(inSlot, food.name),
      protein_g: food.protein_g,
      times: food.times,
      source: 'history',
      severity: 'info',
    }))

  if (learned.length >= limit) return learned

  const known = new Set(learned.map((s) => foldTr(s.food)))
  const seeds = SEED_FOODS.filter((s) => s.slots.includes(slot) && !known.has(foldTr(s.name)))
    .sort((a, b) => b.protein_g - a.protein_g)
    .slice(0, limit - learned.length)
    .map((s): FoodSuggestion => ({
      kind: 'food',
      slot,
      food: s.name,
      grams: s.grams,
      count: null,
      protein_g: s.protein_g,
      times: 0,
      source: 'seed',
      severity: 'info',
    }))
  return [...learned, ...seeds]
}

export interface WeightTrend {
  kind: 'weight_trend'
  /** Haftalik olculen degisim, kayip pozitif. */
  actual_kg: number
  target_kg: number
  delta_kg: number
  status: 'on_track' | 'too_slow' | 'too_fast'
  severity: Severity
}

/**
 * Iki 7-gun hareketli ortalamayi karsilastirir - gunluk kiloya asla tepki verilmez
 * (AGENTS.md kilidi). Hedefin cok uzerinde kayip kas kaybi riskidir, hic kayip
 * yoksa acik yetersizdir. Hedef yuzdedir ve mutlak tavan haftada %1'dir.
 */
export function weightTrend(
  prevAvgKg: number | null,
  currentAvgKg: number | null,
  goals: Goals,
): WeightTrend | null {
  if (prevAvgKg == null || currentAvgKg == null) return null
  const actual_kg = Number((prevAvgKg - currentAvgKg).toFixed(2))
  const target_kg = weeklyLossKg(goals, currentAvgKg)
  // Bakim hedefinde (0) her iki yonde 0.3 kg'lik olcum gurultusu normaldir.
  const low = target_kg > 0 ? target_kg * 0.5 : -0.3
  // Tavan hedefe gore degil mutlak: hedef %1'in ustunde olsa bile asilmasi risktir.
  const cap = (currentAvgKg * MAX_WEEKLY_LOSS_PCT) / 100
  const high = Math.min(target_kg > 0 ? target_kg * 1.5 : 0.3, cap)
  const status = actual_kg > high ? 'too_fast' : actual_kg < low ? 'too_slow' : 'on_track'
  return {
    kind: 'weight_trend',
    actual_kg,
    target_kg,
    delta_kg: Number((actual_kg - target_kg).toFixed(2)),
    status,
    severity: status === 'on_track' ? 'info' : 'warn',
  }
}
