import { describe, expect, test } from 'vitest'

import type { DailyLog, WearableRecord, Workout } from './db'
import { adherencePct, dayAverage, estimateKcal, frequentPortions, movingAverage, setsByMuscle, streak, weightDelta } from './metrics'

const log = (date: string, fields: Partial<DailyLog> = {}): DailyLog =>
  ({ date, updated_at: '', ...fields })

describe('movingAverage', () => {
  test('ignores missing days instead of treating them as zero', () => {
    expect(movingAverage([80, null, 82, undefined])).toBe(81)
  })

  test('returns null when nothing was logged', () => {
    expect(movingAverage([null, undefined])).toBeNull()
  })
})

describe('adherencePct', () => {
  const dates = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']

  test('counts only days that reached the goal', () => {
    const logs = [log(dates[0]!, { protein_g: 150 }), log(dates[1]!, { protein_g: 100 })]
    expect(adherencePct(logs, dates, 140)).toBe(25)
  })

  test('a day exactly at the goal counts', () => {
    expect(adherencePct([log(dates[0]!, { protein_g: 140 })], [dates[0]!], 140)).toBe(100)
  })

  test('empty window is 0, not NaN', () => {
    expect(adherencePct([], [], 140)).toBe(0)
  })
})

describe('streak', () => {
  const week = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']

  test('counts consecutive days back from today', () => {
    expect(streak(new Set(['2026-01-02', '2026-01-03', '2026-01-04']), week)).toBe(3)
  })

  test('today not logged yet does not break yesterday-based streak', () => {
    expect(streak(new Set(['2026-01-02', '2026-01-03']), week)).toBe(2)
  })

  test('a gap ends the streak', () => {
    expect(streak(new Set(['2026-01-01', '2026-01-04']), week)).toBe(1)
  })

  test('nothing logged is 0', () => {
    expect(streak(new Set(), week)).toBe(0)
  })
})

describe('setsByMuscle', () => {
  test('credits every worked group with the session sets', () => {
    const workouts: Workout[] = [
      { id: '1', date: '2026-01-01', type: 'resistance', sets_total: 6, muscle_groups: ['chest', 'back'] },
      { id: '2', date: '2026-01-02', type: 'resistance', sets_total: 4, muscle_groups: ['chest'] },
      { id: '3', date: '2026-01-03', type: 'walk', sets_total: null, muscle_groups: [] },
    ]
    expect(setsByMuscle(workouts)).toEqual({ chest: 10, back: 6 })
  })
})

describe('weightDelta', () => {
  test('compares first and last logged weight', () => {
    expect(weightDelta([log('2026-01-01', { weight_kg: 83 }), log('2026-01-07', { weight_kg: 82.4 })])).toBe(-0.6)
  })

  test('needs at least two weigh-ins', () => {
    expect(weightDelta([log('2026-01-01', { weight_kg: 83 })])).toBeNull()
  })
})

describe('dayAverage', () => {
  const rec = (date: string, metric: string, value: number): WearableRecord =>
    ({ id: `${date}:${metric}`, date, metric, value, source: 'health_connect', synced_at: '' })

  test('averages only the requested metric', () => {
    expect(dayAverage([rec('2026-09-09', 'resting_hr', 60), rec('2026-09-10', 'resting_hr', 70), rec('2026-09-10', 'steps', 5000)], 'resting_hr')).toBe(65)
  })

  test('returns null when the watch was never worn', () => {
    expect(dayAverage([rec('2026-09-10', 'steps', 5000)], 'resting_hr')).toBeNull()
  })
})

describe('estimateKcal', () => {
  const workout = (fields: Partial<Workout>): Workout =>
    ({ id: '1', date: '2026-09-10', type: 'resistance', muscle_groups: [], ...fields })

  test('MET x kilo x saat', () => {
    // Direnc 5 MET, 100 kg, 60 dk -> 500 kcal
    expect(estimateKcal(workout({ duration_min: 60 }), 100)).toBe(500)
    expect(estimateKcal(workout({ type: 'walk', duration_min: 30 }), 100)).toBe(175)
  })

  test('kilo veya sure yoksa tahmin uretmez', () => {
    expect(estimateKcal(workout({ duration_min: 60 }), null)).toBeNull()
    expect(estimateKcal(workout({ duration_min: null }), 100)).toBeNull()
  })
})

describe('frequentPortions', () => {
  test('en sik girilen porsiyonlari one alir', () => {
    expect(frequentPortions([25, 25, 25, 50, 50, 12])).toEqual([10, 25, 50])
  })

  test('gecmis yoksa varsayilana duser', () => {
    expect(frequentPortions([])).toEqual([30, 35, 40])
    expect(frequentPortions([null, undefined, 0])).toEqual([30, 35, 40])
  })
})
