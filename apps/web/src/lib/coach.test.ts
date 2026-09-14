import { describe, expect, test } from 'vitest'

import { coachTips, deloadTip, progressTips, todayFocus, volumeTips } from './coach'
import type { Workout } from './db'
import { DEFAULT_GOALS } from './settings'
import type { Split } from './split'

const session = (date: string, groups: string[], fields: Partial<Workout> = {}): Workout =>
  ({ id: date + groups.join(), date, type: 'resistance', muscle_groups: groups, ...fields })

describe('volumeTips', () => {
  const goals = { ...DEFAULT_GOALS, sets_per_group: 10 }

  test('a group below the weekly goal asks for the missing sets', () => {
    const tips = volumeTips([session('2026-01-05', ['göğüs'], { sets_total: 6 })], goals, {})
    expect(tips).toEqual([{ kind: 'volume_low', muscle: 'göğüs', sets: 6, target: 10, add: 4, severity: 'info' }])
  })

  test('a group inside the effective range produces nothing', () => {
    expect(volumeTips([session('2026-01-05', ['sırt'], { sets_total: 14 })], goals, {})).toEqual([])
  })

  test('a group over the diminishing-returns threshold is reported as info, not a warning', () => {
    const tips = volumeTips([session('2026-01-05', ['kol'], { sets_total: 24 })], goals, {})
    expect(tips).toEqual([{ kind: 'volume_high', muscle: 'kol', sets: 24, cap: 20, severity: 'info' }])
  })

  test('a group the split plans but the week never touched is its own warning', () => {
    const split: Split = { 1: ['bacak'], 3: ['göğüs'] }
    const tips = volumeTips([session('2026-01-05', ['göğüs'], { sets_total: 12 })], goals, split)
    expect(tips).toEqual([{ kind: 'volume_none', muscle: 'bacak', severity: 'warn' }])
  })

  test('a goal above the evidence ceiling does not flag itself as too much', () => {
    const ambitious = { ...DEFAULT_GOALS, sets_per_group: 24 }
    expect(volumeTips([session('2026-01-05', ['bacak'], { sets_total: 24 })], ambitious, {})).toEqual([])
  })

  test('untouched groups come before volume advice, and groups are ordered', () => {
    const split: Split = { 1: ['karın', 'omuz'] }
    const tips = volumeTips([session('2026-01-05', ['sırt'], { sets_total: 2 })], goals, split)
    expect(tips.map((t) => [t.kind, 'muscle' in t ? t.muscle : null])).toEqual([
      ['volume_none', 'karın'],
      ['volume_none', 'omuz'],
      ['volume_low', 'sırt'],
    ])
  })

  test('an empty week with no split says nothing rather than guessing', () => {
    expect(volumeTips([], goals, {})).toEqual([])
  })
})

describe('progressTips', () => {
  const goals = { ...DEFAULT_GOALS, sets_per_group: 10 }
  const now = '2026-01-10'
  const lift = (date: string, groups: string[], weight: number, sets: number, reps: number): Workout =>
    session(date, groups, { weight_kg: weight, sets_total: sets, reps_total: reps })

  test('same weight with reps over the range raises the weight', () => {
    // Ust govde adimi %2.5: 60 kg -> 61.5 -> 62 kg.
    const tips = progressTips([
      lift('2026-01-05', ['göğüs'], 60, 4, 56),
      lift('2026-01-08', ['göğüs'], 60, 4, 56),
    ], goals, now)
    expect(tips[0]).toEqual({ kind: 'progress_weight', muscle: 'göğüs', from_kg: 60, to_kg: 62, severity: 'info' })
  })

  test('the lower body step is bigger than the upper body one', () => {
    const tips = progressTips([
      lift('2026-01-05', ['bacak'], 100, 4, 56),
      lift('2026-01-08', ['bacak'], 100, 4, 56),
    ], goals, now)
    expect(tips[0]).toEqual({ kind: 'progress_weight', muscle: 'bacak', from_kg: 100, to_kg: 105, severity: 'info' })
  })

  test('a light lift still gains a whole kilo, never zero', () => {
    const tips = progressTips([
      lift('2026-01-05', ['kol'], 10, 4, 56),
      lift('2026-01-08', ['kol'], 10, 4, 56),
    ], goals, now)
    expect(tips[0]).toMatchObject({ kind: 'progress_weight', to_kg: 11 })
  })

  test('same weight with reps inside the range raises the reps', () => {
    const tips = progressTips([
      lift('2026-01-05', ['sırt'], 40, 4, 40),
      lift('2026-01-08', ['sırt'], 40, 4, 40),
    ], goals, now)
    expect(tips[0]).toEqual({ kind: 'progress_reps', muscle: 'sırt', reps: 10, to_reps: 11, severity: 'info' })
  })

  test('weekly sets under the goal ask for a set before anything else applies', () => {
    const tips = progressTips([lift('2026-01-08', ['omuz'], 40, 4, 40)], goals, now)
    expect(tips[0]).toEqual({ kind: 'progress_sets', muscle: 'omuz', sets: 4, target: 10, severity: 'info' })
  })

  test('three sessions with nothing rising is a stall warning', () => {
    const tips = progressTips([
      lift('2026-01-02', ['göğüs'], 60, 5, 50),
      lift('2026-01-05', ['göğüs'], 60, 5, 50),
      lift('2026-01-08', ['göğüs'], 60, 5, 50),
    ], goals, now)
    expect(tips).toContainEqual({ kind: 'stall', muscle: 'göğüs', sessions: 3, severity: 'warn' })
  })

  test('a rising session clears the stall', () => {
    const tips = progressTips([
      lift('2026-01-02', ['göğüs'], 60, 5, 50),
      lift('2026-01-05', ['göğüs'], 60, 5, 50),
      lift('2026-01-08', ['göğüs'], 62, 5, 50),
    ], goals, now)
    expect(tips.some((t) => t.kind === 'stall')).toBe(false)
  })

  test('without weight there is no guess, only a data gap', () => {
    const tips = progressTips([session('2026-01-08', ['karın'], { sets_total: 4 })], goals, now)
    expect(tips).toEqual([{ kind: 'no_data', muscle: 'karın', severity: 'info' }])
  })

  test('cardio is not a progression subject', () => {
    const cardio: Workout = { id: 'c', date: '2026-01-08', type: 'cardio', muscle_groups: ['bacak'], duration_min: 30 }
    expect(progressTips([cardio], goals, now)).toEqual([])
  })

  test('sessions older than the week still count as history, not as weekly sets', () => {
    const tips = progressTips([
      lift('2025-12-20', ['sırt'], 40, 12, 120),
      lift('2025-12-27', ['sırt'], 40, 12, 120),
    ], goals, now)
    // Haftalik pencerede hic set yok; oneri yine de gecmise bakip tekrar artirir.
    expect(tips[0]).toMatchObject({ kind: 'progress_reps', muscle: 'sırt' })
  })
})

describe('deloadTip', () => {
  const now = '2026-02-05'
  // Bir hafta arayla, hacmi verilen seans: tonaj = set x agirlik.
  const at = (date: string, sets: number, weight: number): Workout =>
    session(date, ['göğüs'], { sets_total: sets, weight_kg: weight })

  test('five weeks of uninterrupted build asks for a light week', () => {
    const tip = deloadTip([
      at('2026-01-05', 10, 50), at('2026-01-12', 11, 50), at('2026-01-19', 12, 50),
      at('2026-01-26', 13, 50), at('2026-02-02', 14, 50),
    ], now)
    expect(tip).toEqual({ kind: 'deload', reason: 'buildup', weeks: 5, severity: 'warn' })
  })

  test('four weeks of build is not yet a deload', () => {
    const tip = deloadTip([
      at('2026-01-12', 11, 50), at('2026-01-19', 12, 50),
      at('2026-01-26', 13, 50), at('2026-02-02', 14, 50),
    ], now)
    expect(tip).toBeNull()
  })

  test('three weeks of falling volume is a deload for the other reason', () => {
    const tip = deloadTip([
      at('2026-01-19', 14, 50), at('2026-01-26', 12, 50), at('2026-02-02', 10, 50),
    ], now)
    expect(tip).toEqual({ kind: 'deload', reason: 'decline', weeks: 3, severity: 'warn' })
  })

  test('a steady block is neither build nor decline', () => {
    const tip = deloadTip([
      at('2026-01-19', 12, 50), at('2026-01-26', 12, 50), at('2026-02-02', 12, 50),
    ], now)
    expect(tip).toBeNull()
  })

  test('a missed week breaks the run instead of counting as growth', () => {
    const tip = deloadTip([
      at('2026-01-05', 10, 50), at('2026-01-12', 11, 50),
      at('2026-01-26', 13, 50), at('2026-02-02', 14, 50),
    ], now)
    expect(tip).toBeNull()
  })

  test('no history at all is no signal', () => {
    expect(deloadTip([], now)).toBeNull()
  })

  test('weight-free sessions still carry volume through set count', () => {
    const tip = deloadTip([
      session('2026-01-19', ['sırt'], { sets_total: 14 }),
      session('2026-01-26', ['sırt'], { sets_total: 12 }),
      session('2026-02-02', ['sırt'], { sets_total: 10 }),
    ], now)
    expect(tip).toMatchObject({ reason: 'decline' })
  })
})

describe('todayFocus', () => {
  test('reports the planned groups and that nothing is logged yet', () => {
    const split: Split = { 1: ['bacak'] }
    expect(todayFocus(split, [], '2026-01-05')).toEqual({
      kind: 'today', groups: ['bacak'], logged: false, severity: 'info',
    })
  })

  test('a session on the day flips logged', () => {
    const split: Split = { 1: ['bacak'] }
    const tip = todayFocus(split, [session('2026-01-05', ['bacak'], { sets_total: 9 })], '2026-01-05')
    expect(tip.logged).toBe(true)
  })

  test('a day outside the split is a free day, not an error', () => {
    expect(todayFocus({}, [], '2026-01-05')).toMatchObject({ groups: [], logged: false })
  })
})

describe('coachTips', () => {
  test('collects every rule into one ordered list', () => {
    const goals = { ...DEFAULT_GOALS, sets_per_group: 10 }
    const split: Split = { 1: ['göğüs'] }
    const workouts = [session('2026-01-05', ['göğüs'], { sets_total: 4, weight_kg: 50, reps_total: 40 })]
    const kinds = coachTips(workouts, goals, split, '2026-01-05').map((t) => t.kind)
    expect(kinds).toContain('volume_low')
    expect(kinds).toContain('progress_sets')
    expect(kinds[kinds.length - 1]).toBe('today')
  })

  test('volume advice only counts the last seven days', () => {
    const goals = { ...DEFAULT_GOALS, sets_per_group: 10 }
    const old = session('2025-11-01', ['sırt'], { sets_total: 40 })
    const tips = coachTips([old], goals, {}, '2026-01-05')
    expect(tips.some((t) => t.kind === 'volume_high')).toBe(false)
  })
})
