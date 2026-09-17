import { describe, expect, test } from 'vitest'

import type { Meal } from './db'
import {
  foldTr,
  mealSlot,
  proteinTarget,
  slotGaps,
  suggestFoods,
  suggestMenus,
  weeklyLossKg,
  weightTrend,
  type MealSlot,
  type SlotGap,
} from './nutrition'

const meal = (time: string, note: string, protein_g: number, date = '2026-01-10'): Meal =>
  ({ id: `${date}-${time}-${note}`, date, time, note, protein_g, kcal: null, estimated: false })

describe('mealSlot', () => {
  test('maps the clock to the named slot boundaries', () => {
    expect(mealSlot('07:30')).toBe('morning')
    expect(mealSlot('12:00')).toBe('noon')
    expect(mealSlot('19:45')).toBe('evening')
  })

  test('outside the three main windows it is a snack', () => {
    expect(mealSlot('23:30')).toBe('snack')
    expect(mealSlot('03:00')).toBe('snack')
  })
})

describe('proteinTarget', () => {
  test('range comes from the 7-day average weight, not a single day', () => {
    const t = proteinTarget(80, { protein_g: 140, weekly_loss_pct: 0, sets_per_group: 10 })
    expect(t?.min_g).toBe(128)
    expect(t?.max_g).toBe(176)
  })

  test('in a deficit it recommends the upper end to protect muscle', () => {
    const cutting = proteinTarget(80, { protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10 })
    const maintaining = proteinTarget(80, { protein_g: 140, weekly_loss_pct: 0, sets_per_group: 10 })
    expect(cutting?.recommended_g).toBe(176)
    expect(maintaining?.recommended_g).toBe(144)
  })

  test('reports the difference from the stored goal without changing it', () => {
    const goals = { protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10 }
    const t = proteinTarget(80, goals)
    expect(t?.current_goal_g).toBe(140)
    expect(t?.delta_g).toBe(36)
    expect(goals.protein_g).toBe(140)
  })

  test('a goal below the effective range is flagged', () => {
    expect(proteinTarget(80, { protein_g: 100, weekly_loss_pct: 0, sets_per_group: 10 })?.severity).toBe('warn')
    expect(proteinTarget(80, { protein_g: 140, weekly_loss_pct: 0, sets_per_group: 10 })?.severity).toBe('info')
  })

  test('no weight average means no advice at all', () => {
    expect(proteinTarget(null, { protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10 })).toBeNull()
  })
})

describe('slotGaps', () => {
  const goals = { protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10 }

  test('per-slot target is 0.4 g/kg of the average weight', () => {
    const gaps = slotGaps([], 80, goals, '21:00')
    expect(gaps.filter((g) => g.slot !== 'snack').map((g) => g.target_g)).toEqual([32, 32, 32])
  })

  test('subtracts what the slot already got', () => {
    const gaps = slotGaps([meal('08:00', 'yumurta beyazi', 20)], 80, goals, '21:00')
    expect(gaps.find((g) => g.slot === 'morning')?.gap_g).toBe(12)
  })

  test('a slot that reached the threshold drops out', () => {
    const gaps = slotGaps([meal('08:00', 'yumurta beyazi', 35)], 80, goals, '21:00')
    expect(gaps.some((g) => g.slot === 'morning')).toBe(false)
  })

  test('slots later than now are plan, not miss', () => {
    const gaps = slotGaps([], 80, goals, '09:00')
    expect(gaps.find((g) => g.slot === 'morning')).toMatchObject({ upcoming: false, severity: 'warn' })
    expect(gaps.find((g) => g.slot === 'evening')).toMatchObject({ upcoming: true, severity: 'info' })
  })

  // Uc ana slot x 0.4 g/kg = 1.2 g/kg; gunluk hedef bunun ustunde (Schoenfeld & Aragon
  // 2018 en az dort ogun ister). Dorduncu ogun atistirmalik slotudur.
  test('the snack slot carries the rest of the daily goal, so three slots are not the whole day', () => {
    const gaps = slotGaps([], 80, goals, '21:00')
    const snack = gaps.find((g) => g.slot === 'snack')
    expect(snack?.target_g).toBe(44)
    expect(gaps.reduce((sum, g) => sum + g.target_g, 0)).toBe(goals.protein_g)
  })

  test('meeting all three main slots still leaves the day short, and it is reported', () => {
    const full = [meal('08:00', 'yumurta beyazi', 32), meal('13:00', 'tavuk', 32), meal('19:00', 'mercimek', 32)]
    const gaps = slotGaps(full, 80, goals, '21:00')
    expect(gaps.map((g) => String(g.slot))).toEqual(['snack'])
    expect(gaps[0]?.gap_g).toBe(44)
  })

  test('a snack already eaten counts against that slot', () => {
    const gaps = slotGaps([meal('23:00', 'yogurt', 20)], 80, goals, '23:30')
    expect(gaps.find((g) => g.slot === 'snack')?.gap_g).toBe(24)
  })

  test('without a weight average the three main slots already cover the daily goal', () => {
    expect(slotGaps([], null, goals, '21:00').some((g) => g.slot === 'snack')).toBe(false)
  })

  test('without a weight average it falls back to a third of the daily goal', () => {
    expect(slotGaps([], null, goals, '21:00').map((g) => g.target_g)).toEqual([47, 47, 47])
  })
})

describe('suggestFoods', () => {
  const history: Meal[] = [
    meal('08:00', '6 yumurta beyazi', 22, '2026-01-01'),
    meal('08:10', '6 yumurta beyazi', 22, '2026-01-02'),
    meal('08:05', '200 g suzme peynir', 22, '2026-01-03'),
    meal('13:00', '200 g tavuk gogsu', 62, '2026-01-01'),
    meal('13:00', '200 g tavuk gogsu', 62, '2026-01-02'),
    meal('19:00', '250 g fasulye', 22, '2026-01-01'),
  ]

  test('suggests only foods eaten in that slot before', () => {
    const names = suggestFoods(history, 'noon').map((s) => s.food)
    expect(names).toContain('tavuk gogsu')
    expect(names).not.toContain('fasulye')
  })

  test('carries the learned portion and its protein', () => {
    const tavuk = suggestFoods(history, 'noon').find((s) => s.food === 'tavuk gogsu')
    expect(tavuk).toMatchObject({ grams: 200, protein_g: 62, source: 'history' })
  })

  test('keeps a bare count as a count, not as grams', () => {
    const egg = suggestFoods(history, 'morning').find((s) => s.food === 'yumurta beyazi')
    expect(egg).toMatchObject({ count: 6, grams: null, protein_g: 22 })
  })

  test('what was eaten a lot in the last few days is pushed back for variety', () => {
    const recent = [meal('08:00', '6 yumurta beyazi', 22, '2026-01-09'), meal('08:00', '6 yumurta beyazi', 22, '2026-01-10')]
    const plain = suggestFoods(history, 'morning').map((s) => s.food)
    const varied = suggestFoods(history, 'morning', { recentMeals: recent }).map((s) => s.food)
    expect(plain[0]).toBe('yumurta beyazi')
    expect(varied[0]).toBe('suzme peynir')
  })

  test('falls back to the seed list when the slot has no history', () => {
    const seeded = suggestFoods([], 'evening')
    expect(seeded.length).toBeGreaterThan(0)
    expect(seeded.every((s) => s.source === 'seed')).toBe(true)
    expect(seeded.every((s) => s.protein_g > 0)).toBe(true)
  })

  test('learned values beat the seed for the same food', () => {
    const learned = [meal('13:00', '200 g tavuk gogsu', 50, '2026-01-01'), meal('13:05', '200 g tavuk gogsu', 50, '2026-01-02')]
    const out = suggestFoods(learned, 'noon')
    expect(out[0]).toMatchObject({ food: 'tavuk gogsu', protein_g: 50, source: 'history' })
    expect(out.filter((s) => s.food === 'tavuk gogsu')).toHaveLength(1)
  })

  test('history always outranks the seed', () => {
    const out = suggestFoods(history, 'evening')
    expect(out[0]).toMatchObject({ food: 'fasulye', source: 'history' })
  })

  test('never invents a food the user has no history with once the slot is well known', () => {
    const rich: Meal[] = Array.from({ length: 4 }, (_, i) =>
      meal('13:00', '200 g tavuk gogsu', 62, `2026-01-0${i + 1}`),
    ).concat(
      Array.from({ length: 4 }, (_, i) => meal('13:30', '200 g kirmizi et', 52, `2026-01-0${i + 1}`)),
      Array.from({ length: 4 }, (_, i) => meal('13:40', '200 g hindi', 58, `2026-01-0${i + 1}`)),
    )
    expect(suggestFoods(rich, 'noon').every((s) => s.source === 'history')).toBe(true)
  })
})

describe('weeklyLossKg', () => {
  test('the goal is a percentage of body weight, not a fixed kilogram', () => {
    expect(weeklyLossKg({ protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10 }, 60)).toBe(0.42)
    expect(weeklyLossKg({ protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10 }, 110)).toBe(0.77)
  })

  test('a goal saved in kilograms before the switch is kept as it was', () => {
    const legacy = { protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10, weekly_weight_loss_kg: 0.6 }
    expect(weeklyLossKg(legacy, 110)).toBe(0.6)
  })
})

describe('weightTrend', () => {
  const goals = { protein_g: 140, weekly_loss_pct: 0.75, sets_per_group: 10 }
  const maintain = { ...goals, weekly_loss_pct: 0 }

  test('loss close to the goal is on track', () => {
    expect(weightTrend(80.6, 80, goals)).toMatchObject({ status: 'on_track', severity: 'info' })
  })

  test('losing far faster than the goal risks muscle', () => {
    expect(weightTrend(81.5, 80, goals)).toMatchObject({ status: 'too_fast', severity: 'warn' })
  })

  test('no movement means the deficit is not there', () => {
    expect(weightTrend(80.1, 80, goals)).toMatchObject({ status: 'too_slow', severity: 'warn' })
  })

  test('reports the measured weekly change against the target', () => {
    expect(weightTrend(80.6, 80, goals)).toMatchObject({ actual_kg: 0.6, target_kg: 0.6, delta_kg: 0 })
  })

  test('the target follows the weight: the same percentage is a different kilogram', () => {
    const evidenceDefault = { ...goals, weekly_loss_pct: 0.7 }
    expect(weightTrend(80.6, 80, evidenceDefault)?.target_kg).toBe(0.56)
    expect(weightTrend(110.6, 110, evidenceDefault)?.target_kg).toBe(0.77)
  })

  // Garthe 2011 / Helms 2014: haftada %1'in ustu, hedef ne olursa olsun kas kaybi riski.
  test('above one percent a week is too fast even when the goal itself is higher', () => {
    const aggressive = { ...goals, weekly_loss_pct: 1.5 }
    expect(weightTrend(81, 80, aggressive)?.status).toBe('too_fast')
    expect(weightTrend(80.7, 80, aggressive)?.status).toBe('on_track')
  })

  test('a goal still stored in kilograms keeps working', () => {
    const legacy = { ...goals, weekly_weight_loss_kg: 0.6 }
    expect(weightTrend(80.6, 80, legacy)).toMatchObject({ target_kg: 0.6, status: 'on_track' })
  })

  test('a missing week of averages yields nothing', () => {
    expect(weightTrend(null, 80, goals)).toBeNull()
    expect(weightTrend(80, null, goals)).toBeNull()
  })

  test('gaining while the goal is loss is not on track', () => {
    expect(weightTrend(79.5, 80, goals)?.status).toBe('too_slow')
  })

  test('at a maintenance goal both directions have a noise band', () => {
    expect(weightTrend(80.1, 80, maintain)?.status).toBe('on_track')
    expect(weightTrend(80.5, 80, maintain)?.status).toBe('too_fast')
  })
})

describe('foldTr', () => {
  test('folds Turkish letters and case so the same food matches itself', () => {
    expect(foldTr('Yumurta Beyazı')).toBe(foldTr('yumurta beyazi'))
    expect(foldTr(' Tavuk Göğsü ')).toBe('tavuk gogsu')
    expect(foldTr('kırmızı et')).toBe('kirmizi et')
  })

  test('keeps different foods apart', () => {
    expect(foldTr('fasulye')).not.toBe(foldTr('mercimek'))
  })
})

describe('suggestFoods - seed does not duplicate a learned food', () => {
  // Kullanici ASCII yaziyor, tohum listesi duzgun Turkce: ham karsilastirma
  // bunlari iki ayri yiyecek sayip ayni seyi iki kez onerirdi.
  const asciiSpelling: Meal[] = [
    meal('08:00', '6 yumurta beyazi', 22, '2026-01-01'),
    meal('08:10', '6 yumurta beyazi', 22, '2026-01-02'),
  ]

  test('the seed spelled differently is not offered next to the learned entry', () => {
    const folded = suggestFoods(asciiSpelling, 'morning').map((s) => foldTr(s.food))
    expect(new Set(folded).size).toBe(folded.length)
    expect(folded.filter((n) => n === 'yumurta beyazi')).toHaveLength(1)
  })

  test("the learned entry keeps the user's own spelling", () => {
    const first = suggestFoods(asciiSpelling, 'morning')[0]
    expect(first?.food).toBe('yumurta beyazi')
    expect(first?.source).toBe('history')
  })
})

describe('suggestMenus', () => {
  const gap = (gap_g: number, slot: MealSlot = 'evening'): SlotGap => ({
    kind: 'slot_gap',
    slot,
    consumed_g: 0,
    target_g: gap_g,
    gap_g,
    upcoming: false,
    severity: 'warn',
  })

  const history: Meal[] = [
    meal('19:00', '200 g tavuk göğsü', 62, '2026-01-01'),
    meal('19:10', '200 g tavuk göğsü', 62, '2026-01-02'),
    meal('19:20', '250 g mercimek', 23, '2026-01-03'),
    meal('19:30', '250 g mercimek', 23, '2026-01-04'),
  ]

  test('setler birbirinden en az bir kalem farkli', () => {
    const sets = suggestMenus(history, gap(40), { recentMeals: history })
    const signatures = sets.map((s) => s.items.map((i) => i.food).sort().join('|'))
    expect(new Set(signatures).size).toBe(signatures.length)
  })

  test('her set acigi kapatmaya calisir ve kapatip kapatmadigini bildirir', () => {
    for (const set of suggestMenus(history, gap(40), {})) {
      expect(set.covers_gap).toBe(set.protein_g >= 40)
    }
  })

  test('acigi tek kalemle kapatan en kucuk secenek gelir', () => {
    const [first] = suggestMenus(history, gap(20), {})
    expect(first?.items).toHaveLength(1)
    // 62 g tavuk da kapatir ama 23 g mercimek yeter; fazlasi "kapattim" degildir.
    expect(first?.items[0]?.protein_g).toBe(23)
  })

  test('tek kalem yetmiyorsa kalemler birikir', () => {
    const set = suggestMenus(history, gap(80), {})[0]!
    expect(set.items.length).toBeGreaterThan(1)
    expect(set.protein_g).toBeGreaterThanOrEqual(80)
  })

  test('degisiklik seti bu hafta yenen kalemleri disarida birakir ve meydan okumadir', () => {
    const recent = [meal('19:00', '200 g tavuk göğsü', 62, '2026-01-09')]
    const change = suggestMenus(history, gap(40), { recentMeals: recent }).find((s) => s.set === 'change')
    expect(change?.challenge).toBe(true)
    expect(change?.items.map((i) => i.food)).not.toContain('tavuk göğsü')
  })

  test('hizli set porsiyonu bilinen en fazla iki kalem tasir', () => {
    const quick = suggestMenus(history, gap(200), {}).find((s) => s.set === 'quick')
    expect(quick?.items.length).toBeLessThanOrEqual(2)
    for (const item of quick?.items ?? []) expect(item.grams ?? item.count).not.toBeNull()
  })

  test('tam olarak bir set onceden secili gelir ve o acigi kapatir', () => {
    const sets = suggestMenus(history, gap(40), { recentMeals: history })
    expect(sets.filter((s) => s.selected)).toHaveLength(1)
    expect(sets.find((s) => s.selected)?.covers_gap).toBe(true)
  })

  test('gecmis yokken tohum listesinden set kurulur', () => {
    const sets = suggestMenus([], gap(40), {})
    expect(sets.length).toBeGreaterThan(0)
    for (const set of sets) {
      for (const item of set.items) expect(item.source).toBe('seed')
    }
  })
})
