import { describe, expect, test } from 'vitest'

import type { DailyLog } from './db'
import { BREAK_DAYS, dietBreak, weeklyPoints, type WeekPoint } from './dietBreak'

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

describe('weeklyPoints', () => {
  const goals = { protein_g: 140, weekly_loss_pct: 0.7, sets_per_group: 10 }
  const today = '2026-09-17'
  const day = (back: number): string => {
    const d = new Date(2026, 8, 17 - back)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const log = (back: number, weight_kg: number, waist_cm?: number): DailyLog => ({
    date: day(back), weight_kg, waist_cm: waist_cm ?? null, updated_at: '',
  })

  test('her 7 gun bir nokta, ilk hafta karsilastirilamadigi icin dusuyor', () => {
    const logs = [log(21, 90), log(14, 89), log(7, 88), log(0, 87)]
    expect(weeklyPoints(logs, goals, today)).toHaveLength(3)
  })

  test('kilo dususu yavassa durum too_slow olur', () => {
    const logs = [log(14, 90), log(7, 89.95), log(0, 89.9)]
    const points = weeklyPoints(logs, goals, today)
    expect(points.map((p) => p.status)).toEqual(['too_slow', 'too_slow'])
    expect(points.every((p) => p.target_kg > 0)).toBe(true)
  })

  test('tartisiz hafta atlanir, bel o haftanin son olcusunden alinir', () => {
    const logs = [log(14, 90), log(8, 89, 104), log(7, 89, 103), log(0, 88)]
    const points = weeklyPoints(logs, goals, today)
    expect(points).toHaveLength(2)
    expect(points[0]?.waist_cm).toBe(103)
    expect(points[1]?.waist_cm).toBeNull()
  })

  test('pencere disindaki eski kayitlar sayilmaz', () => {
    const logs = [log(200, 100), log(7, 88), log(0, 87)]
    expect(weeklyPoints(logs, goals, today, 4)).toHaveLength(1)
  })
})
