import { describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
  registerPlugin: () => ({}),
}))

import type { Meal, Workout } from './db'
import { DEFAULT_GOALS } from './settings'
import { buildWatchSummary, lastWeight } from './watchSummary'

const meal = (date: string, protein_g: number, kcal: number): Meal =>
  ({ id: `${date}-${kcal}`, date, time: '12:00', protein_g, kcal, note: null, estimated: false }) as Meal

const workout = (date: string, exercise_id: string, weight_kg: number | null): Workout => ({
  id: date,
  date,
  type: 'resistance',
  muscle_groups: [],
  sets: [{ id: `${date}-1`, exercise_id, set_no: 1, weight_kg, reps: 12, done_at: null }],
})

describe('buildWatchSummary', () => {
  it('fills every field from the day and the week', () => {
    const s = buildWatchSummary({
      today: '2026-10-05',
      mealsToday: [meal('2026-10-05', 23, 380), meal('2026-10-05', 40, 600)],
      kcalMeals: [meal('2026-10-03', 10, 2000), meal('2026-10-04', 10, 1800)],
      logs7: [
        { date: '2026-09-29', weight_kg: 107.5, updated_at: '' },
        { date: '2026-10-05', weight_kg: 107.1, steps: 6382, updated_at: '' },
      ],
      goals: { ...DEFAULT_GOALS, protein_g: 150, kcal_week_max: 1900 },
      planDay: { weekday: 1, day_type: 'lift', exercises: [{ id: 'Leg_Press', sets: 2 }, { id: 'Nope' }] },
      workouts: [workout('2026-09-28', 'Leg_Press', 30), workout('2026-10-02', 'Leg_Press', 35)],
    })
    expect(s).toEqual({
      date: '2026-10-05',
      protein_g: 63,
      protein_goal: 150,
      kcal_avg7: 1900,
      kcal_max: 1900,
      weight_delta7: -0.4,
      steps: 6382,
      plan: [
        { id: 'Leg_Press', name: 'Leg press', sets: 2, last_kg: 35 },
        { id: 'Nope', name: 'Nope', sets: 2, last_kg: null },
      ],
    })
  })

  it('empty day is null, not zero; rest day has no plan', () => {
    const s = buildWatchSummary({
      today: '2026-10-06',
      mealsToday: [],
      kcalMeals: [],
      logs7: [],
      goals: DEFAULT_GOALS,
      planDay: { weekday: 2, day_type: 'swim', exercises: [{ id: 'Leg_Press' }] },
      workouts: [],
    })
    expect(s.protein_g).toBeNull()
    expect(s.kcal_avg7).toBeNull()
    expect(s.weight_delta7).toBeNull()
    expect(s.steps).toBeNull()
    expect(s.plan).toEqual([])
  })

  it('lastWeight skips sets without kg', () => {
    expect(lastWeight([workout('2026-10-01', 'Leg_Press', 35), workout('2026-10-02', 'Leg_Press', null)], 'Leg_Press')).toBe(35)
    expect(lastWeight([], 'Leg_Press')).toBeNull()
  })
})
