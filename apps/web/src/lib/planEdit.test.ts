import { describe, expect, test } from 'vitest'

import { addExercise, removeExercise, replaceExercise, stepSets } from './planEdit'
import type { PlanExercise } from './workoutPlan'

const day: PlanExercise[] = [
  { id: 'Leg_Press', sets: 3, warmup: 2, slot: 'legs' },
  { id: 'Dead_Bug', sets: 1 },
]

describe('planEdit', () => {
  // Degistirilen hareket yerini, set ve rampa sayisini korur: yalniz hareket degisir.
  test('degistir sira ve seti korur', () => {
    expect(replaceExercise(day, 0, 'Hack_Squat')[0]).toEqual({ id: 'Hack_Squat', sets: 3, warmup: 2, slot: 'legs' })
    expect(day[0]!.id).toBe('Leg_Press')
  })

  test('set 1 ile 6 arasinda kalir', () => {
    expect(stepSets(day, 1, -1)[1]!.sets).toBe(1)
    expect(stepSets(day, 0, 1)[0]!.sets).toBe(4)
    expect(stepSets([{ id: 'x', sets: 6 }], 0, 1)[0]!.sets).toBe(6)
    expect(stepSets([{ id: 'x' }], 0, 1)[0]!.sets).toBe(4)
  })

  test('kaldir ve ekle', () => {
    expect(removeExercise(day, 0).map((e) => e.id)).toEqual(['Dead_Bug'])
    expect(addExercise(day, 'Plank').at(-1)).toEqual({ id: 'Plank', sets: 3, warmup: 0 })
  })
})
