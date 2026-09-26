import { describe, expect, test } from 'vitest'

import { bodySeries, bodySummary, bodyText } from './body'
import type { WearableRecord } from './db'

const row = (date: string, metric: string, value: number, source = 'okok'): WearableRecord =>
  ({ id: `${date}:${metric}`, date, metric, value, source, synced_at: '' })

const okok = (date: string, weight: number, fat: number, skeletal: number): WearableRecord[] => [
  row(date, 'weight_kg', weight),
  row(date, 'body_fat_kg', fat),
  row(date, 'skeletal_muscle_kg', skeletal),
]

describe('bodySeries', () => {
  test('one point per OKOK date, sorted, lean = weight - fat', () => {
    const rows = [
      ...okok('2026-09-15', 107.6, 37.8, 35.2),
      ...okok('2026-09-12', 107.9, 38.2, 35.3),
      row('2026-09-12', 'body_fat_pct', 35.4),
      row('2026-09-12', 'visceral_fat', 25.5),
    ]
    expect(bodySeries(rows, {})).toEqual([
      { date: '2026-09-12', weight: 107.9, fat_kg: 38.2, fat_pct: 35.4, lean_kg: 69.7, skeletal_kg: 35.3, visceral: 25.5 },
      { date: '2026-09-15', weight: 107.6, fat_kg: 37.8, fat_pct: null, lean_kg: 69.8, skeletal_kg: 35.2, visceral: null },
    ])
  })

  test('ignores non-OKOK rows (Samsung BIA reads 3-4 kg off)', () => {
    const rows = [row('2026-09-20', 'body_fat_kg', 34.1, 'samsung'), row('2026-09-20', 'skeletal_muscle_kg', 39, 'samsung')]
    expect(bodySeries(rows, { '2026-09-20': 107 })).toEqual([])
  })

  test('falls back to daily_log weight when the scale sent none', () => {
    const [point] = bodySeries([row('2026-09-19', 'body_fat_kg', 37.3)], { '2026-09-19': 107.5 })
    expect(point).toMatchObject({ weight: 107.5, lean_kg: 70.2 })
  })

  test('no weight at all -> lean is null, not a guess', () => {
    const [point] = bodySeries([row('2026-09-19', 'body_fat_kg', 37.3)], {})
    expect(point).toMatchObject({ weight: null, lean_kg: null })
  })

  test('a date with only an OKOK weight is not a composition point', () => {
    expect(bodySeries([row('2026-09-19', 'weight_kg', 107.5)], {})).toEqual([])
  })
})

describe('bodySummary', () => {
  const series = bodySeries(
    [
      ...okok('2026-08-01', 110, 40, 35.6),
      ...okok('2026-09-12', 107.9, 38.2, 35.3),
      ...okok('2026-09-19', 107.5, 37.3, 35.1),
      ...okok('2026-09-26', 107.4, 37.2, 35.1),
      row('2026-09-12', 'visceral_fat', 26),
      row('2026-09-26', 'visceral_fat', 25.5),
    ],
    {},
  )

  test('change is latest minus the first reading inside the 28-day window', () => {
    expect(bodySummary(series)).toEqual({
      latest: series.at(-1),
      base: series[1],
      days: 14,
      change: { fat_kg: -1, lean_kg: 0.5, skeletal_kg: -0.2, visceral: -0.5 },
    })
  })

  test('a single reading in the window has no change', () => {
    expect(bodySummary(series.slice(0, 1))?.change).toBeNull()
  })

  test('no data -> null', () => {
    expect(bodySummary([])).toBeNull()
  })

  test('change is null per metric when either end is missing it', () => {
    const s = bodySummary(series)!
    const noVisceral = bodySummary([{ ...s.base, visceral: null }, s.latest])
    expect(noVisceral?.change?.visceral).toBeNull()
  })
})

describe('bodyText', () => {
  const summary = (fat: number, skeletal: number | null, lean: number | null = 0) => ({
    latest: { date: '2026-09-26', weight: 107.4, fat_kg: 37.2, fat_pct: null, lean_kg: 70.2, skeletal_kg: 35.1, visceral: null },
    base: { date: '2026-09-12', weight: 107.9, fat_kg: 38.2, fat_pct: null, lean_kg: 69.7, skeletal_kg: 35.3, visceral: null },
    days: 14,
    change: { fat_kg: fat, lean_kg: lean, skeletal_kg: skeletal, visceral: null },
  })

  test('fat down, muscle held', () => {
    expect(bodyText(summary(-1, -0.2))).toBe('14 günde yağ −1,0 kg, kas korunuyor.')
  })

  test('muscle loss is named', () => {
    expect(bodyText(summary(-1.5, -0.8))).toBe('14 günde yağ −1,5 kg, kas −0,8 kg.')
  })

  test('small fat moves read as flat; lean stands in when skeletal is missing', () => {
    expect(bodyText(summary(0.2, null, 0.6))).toBe('14 günde yağ sabit, kas +0,6 kg.')
  })

  test('no window yet', () => {
    expect(bodyText({ ...summary(0, 0), change: null })).toBe('Değişim için 28 gün içinde ikinci bir tartı gerekiyor.')
  })
})
