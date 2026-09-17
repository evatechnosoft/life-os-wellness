import { describe, expect, test } from 'vitest'

import { BREAK_DAYS, dietBreak, type WeekPoint } from './dietBreak'

const week = (patch: Partial<WeekPoint> = {}): WeekPoint => ({
  status: 'on_track',
  target_kg: 0.6,
  waist_cm: null,
  ...patch,
})

/** `n` hafta acik; son `stalled` haftasi yavas. */
const series = (n: number, stalled: number, waist: (number | null)[] = []): WeekPoint[] =>
  Array.from({ length: n }, (_, i) =>
    week({
      status: i >= n - stalled ? 'too_slow' : 'on_track',
      waist_cm: waist[i] ?? null,
    }),
  )

describe('dietBreak', () => {
  test('yedi hafta yetmez, sekiz hafta + uc yavas hafta oneriyi cikarir', () => {
    expect(dietBreak(series(7, 3))).toBeNull()
    const suggested = dietBreak(series(8, 3))
    expect(suggested?.kind).toBe('diet_break')
    expect(suggested?.weeks_in_deficit).toBe(8)
    expect(suggested?.days).toBe(BREAK_DAYS)
    expect(suggested?.action).toBe('suggest_maintenance')
  })

  test('son uc hafta ustuste yavas degilse cikmaz', () => {
    expect(dietBreak(series(10, 2))).toBeNull()
  })

  test('bel dusuyorsa kilo durmasi yeniden bicimlenmedir, mola onerilmez', () => {
    const waist = [104, 104, 103, 103, 102, 102, 101, 101]
    expect(dietBreak(series(8, 3, waist))).toBeNull()
  })

  test('bel sabitse oneri cikar ve olcumun bilindigi isaretlenir', () => {
    const waist = [102, 102, 102, 102, 102, 102, 102, 102]
    const suggested = dietBreak(series(8, 3, waist))
    expect(suggested?.waist_known).toBe(true)
  })

  test('bel olculmemisse karar kiloya dayanir ve bu isaretlenir', () => {
    expect(dietBreak(series(8, 3))?.waist_known).toBe(false)
    // Tek olcum de karsilastirma degildir.
    expect(dietBreak(series(8, 3, [102]))?.waist_known).toBe(false)
  })

  test('arada bakim haftasi varsa acik serisi oradan baslar', () => {
    const weeks = [...series(5, 0), week({ target_kg: 0, status: 'on_track' }), ...series(4, 3)]
    expect(dietBreak(weeks)).toBeNull()
  })

  test('zaten moladaysa oneri tekrarlanmaz', () => {
    expect(dietBreak(series(12, 3), { on_break: true })).toBeNull()
  })

  test('veri yoksa sessiz', () => {
    expect(dietBreak([])).toBeNull()
  })
})
