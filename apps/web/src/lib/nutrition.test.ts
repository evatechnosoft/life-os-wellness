import { describe, expect, test } from 'vitest'

import type { Meal } from './db'
import { foldTr, mealSlot, proteinTarget, slotGaps, suggestFoods, weightTrend } from './nutrition'

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
    const t = proteinTarget(80, { protein_g: 140, weekly_weight_loss_kg: 0, sets_per_group: 10 })
    expect(t?.min_g).toBe(128)
    expect(t?.max_g).toBe(176)
  })

  test('in a deficit it recommends the upper end to protect muscle', () => {
    const cutting = proteinTarget(80, { protein_g: 140, weekly_weight_loss_kg: 0.6, sets_per_group: 10 })
    const maintaining = proteinTarget(80, { protein_g: 140, weekly_weight_loss_kg: 0, sets_per_group: 10 })
    expect(cutting?.recommended_g).toBe(176)
    expect(maintaining?.recommended_g).toBe(144)
  })

  test('reports the difference from the stored goal without changing it', () => {
    const goals = { protein_g: 140, weekly_weight_loss_kg: 0.6, sets_per_group: 10 }
    const t = proteinTarget(80, goals)
    expect(t?.current_goal_g).toBe(140)
    expect(t?.delta_g).toBe(36)
    expect(goals.protein_g).toBe(140)
  })

  test('a goal below the effective range is flagged', () => {
    expect(proteinTarget(80, { protein_g: 100, weekly_weight_loss_kg: 0, sets_per_group: 10 })?.severity).toBe('warn')
    expect(proteinTarget(80, { protein_g: 140, weekly_weight_loss_kg: 0, sets_per_group: 10 })?.severity).toBe('info')
  })

  test('no weight average means no advice at all', () => {
    expect(proteinTarget(null, { protein_g: 140, weekly_weight_loss_kg: 0.6, sets_per_group: 10 })).toBeNull()
  })
})

describe('slotGaps', () => {
  const goals = { protein_g: 140, weekly_weight_loss_kg: 0.6, sets_per_group: 10 }

  test('per-slot target is 0.4 g/kg of the average weight', () => {
    const gaps = slotGaps([], 80, goals, '21:00')
    expect(gaps.map((g) => g.target_g)).toEqual([32, 32, 32])
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

  test('snacks count toward the day but have no slot target of their own', () => {
    const gaps = slotGaps([meal('23:00', 'yogurt', 20)], 80, goals, '23:30')
    expect(gaps.map((g) => String(g.slot))).toEqual(['morning', 'noon', 'evening'])
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

describe('weightTrend', () => {
  test('loss close to the goal is on track', () => {
    expect(weightTrend(80.6, 80, 0.6)).toMatchObject({ status: 'on_track', severity: 'info' })
  })

  test('losing far faster than the goal risks muscle', () => {
    expect(weightTrend(81.5, 80, 0.6)).toMatchObject({ status: 'too_fast', severity: 'warn' })
  })

  test('no movement means the deficit is not there', () => {
    expect(weightTrend(80.1, 80, 0.6)).toMatchObject({ status: 'too_slow', severity: 'warn' })
  })

  test('reports the measured weekly change against the target', () => {
    expect(weightTrend(80.6, 80, 0.6)).toMatchObject({ actual_kg: 0.6, target_kg: 0.6, delta_kg: 0 })
  })

  test('a missing week of averages yields nothing', () => {
    expect(weightTrend(null, 80, 0.6)).toBeNull()
    expect(weightTrend(80, null, 0.6)).toBeNull()
  })

  test('gaining while the goal is loss is not on track', () => {
    expect(weightTrend(79.5, 80, 0.6)?.status).toBe('too_slow')
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
