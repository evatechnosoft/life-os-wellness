import { describe, expect, test } from 'vitest'

import { nudgeFor, recoveryPlan, type LapseInput } from './lapse'

const base: LapseInput = {
  overate: false,
  kcal_today: null,
  kcal_history: [],
  hunger_scores: [],
  protein_target_g: 176,
  avg_steps: 8000,
  overate_days_this_week: 0,
  overate_days_this_month: 0,
  support_shown: false,
  free_meal_planned: false,
  now: '15:00',
}

const input = (patch: Partial<LapseInput>): LapseInput => ({ ...base, ...patch })

describe('recoveryPlan tetikleri', () => {
  test('tetik yoksa plan da yok', () => {
    expect(recoveryPlan(base)).toBeNull()
  })

  test('kullanicinin isareti tek basina yeter', () => {
    const plan = recoveryPlan(input({ overate: true, overate_days_this_week: 1 }))
    expect(plan?.triggers).toEqual(['flag'])
  })

  test('kcal ortancanin %140 ustundeyse aday', () => {
    const history = [2000, 2000, 2000, 2000, 2000]
    expect(recoveryPlan(input({ kcal_today: 2900, kcal_history: history }))?.triggers).toEqual(['kcal'])
    // Tam esikte degil, ustunde olmali: 2800 = %140.
    expect(recoveryPlan(input({ kcal_today: 2800, kcal_history: history }))).toBeNull()
  })

  test('kcal girilmemis gunde tetik 2 sessiz', () => {
    expect(recoveryPlan(input({ kcal_today: null, kcal_history: [2000, 2000, 2000, 2000] }))).toBeNull()
  })

  test('gecmis dort gunden azsa ortanca gurultu sayilir, tetiklenmez', () => {
    expect(recoveryPlan(input({ kcal_today: 5000, kcal_history: [1200, 1300, 1400] }))).toBeNull()
  })

  test('yalniz son 14 gun sayilir', () => {
    // Eski 5 gun cok dusuk; 14 gunluk pencerede kalan 14 kayit 3000 ortancasini verir.
    const history = [800, 800, 800, 800, 800, ...Array(14).fill(3000)]
    expect(recoveryPlan(input({ kcal_today: 4000, kcal_history: history }))).toBeNull()
  })

  test('8+ aclikla yenen iki ogun tetikler, tek ogun yetmez', () => {
    expect(recoveryPlan(input({ hunger_scores: [9, 8, 4] }))?.triggers).toEqual(['hunger'])
    expect(recoveryPlan(input({ hunger_scores: [9, 5] }))).toBeNull()
  })

  test('tetikler birikir', () => {
    const plan = recoveryPlan(input({
      overate: true,
      overate_days_this_week: 1,
      kcal_today: 3000,
      kcal_history: [2000, 2000, 2000, 2000],
      hunger_scores: [8, 9],
    }))
    expect(plan?.triggers).toEqual(['flag', 'kcal', 'hunger'])
  })

  test('planli serbest ogun gununde telafi cikmaz - planliydi, ceza yok', () => {
    expect(recoveryPlan(input({ overate: true, free_meal_planned: true }))).toBeNull()
  })
})

describe('recoveryPlan icerigi', () => {
  test('protein hedefi aynen tasinir, hicbir alan kisitlama uretmez', () => {
    const plan = recoveryPlan(input({ overate: true, protein_target_g: 176 }))!
    expect(plan.protein_g).toBe(176)
    expect(plan.no_skip_meals).toBe(true)
    expect(plan.next_weigh_in).toBe('skip_tomorrow')
    expect(plan.fiber_servings).toBe(5)
    expect(plan.severity).toBe('info')
  })

  test('gun bitmeden plan bugunun kalan ogunune, bitince yarina yazilir', () => {
    expect(recoveryPlan(input({ overate: true, now: '15:00' }))?.applies_to).toBe('today')
    expect(recoveryPlan(input({ overate: true, now: '21:59' }))?.applies_to).toBe('today')
    expect(recoveryPlan(input({ overate: true, now: '22:00' }))?.applies_to).toBe('tomorrow')
    expect(recoveryPlan(input({ overate: true, now: '23:30' }))?.applies_to).toBe('tomorrow')
  })

  test('adim artisi 7-gun ortalamanin %15i, tavan 3000', () => {
    expect(recoveryPlan(input({ overate: true, avg_steps: 8000 }))?.steps_add).toBe(1200)
    expect(recoveryPlan(input({ overate: true, avg_steps: 40000 }))?.steps_add).toBe(3000)
  })

  test('adim bilinmiyorsa artis uydurulmaz', () => {
    expect(recoveryPlan(input({ overate: true, avg_steps: null }))?.steps_add).toBe(0)
    expect(recoveryPlan(input({ overate: true, avg_steps: 0 }))?.steps_add).toBe(0)
  })

  test('hafta durumu gun sayisindan cikar', () => {
    const at = (days: number) => recoveryPlan(input({ overate: true, overate_days_this_week: days }))?.week_status
    expect(at(1)).toBe('on_track')
    expect(at(2)).toBe('slight')
    expect(at(3)).toBe('reset')
  })

  test('ayda dorduncu isarette uzman onerisi cikar, gosterildiyse bir daha cikmaz', () => {
    const at = (month: number, shown: boolean) =>
      recoveryPlan(input({ overate: true, overate_days_this_month: month, support_shown: shown }))?.refer_support
    expect(at(3, false)).toBe(false)
    expect(at(4, false)).toBe(true)
    expect(at(4, true)).toBe(false)
    expect(at(9, true)).toBe(false)
  })
})

describe('nudgeFor', () => {
  const plan = recoveryPlan(input({ overate: true }))

  test('ayarsizken adaptif: telafi gunu push, digerleri soft', () => {
    expect(nudgeFor({}, plan)).toBe('push')
    expect(nudgeFor({}, null)).toBe('soft')
  })

  test('elle secim adaptifi kapatir', () => {
    expect(nudgeFor({ nudge: 'soft' }, plan)).toBe('soft')
    expect(nudgeFor({ nudge: 'push' }, null)).toBe('push')
  })
})
