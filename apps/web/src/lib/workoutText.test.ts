import { describe, expect, it } from 'vitest'

import { classifyExercise, fillWorkout } from './workoutText'

describe('classifyExercise', () => {
  it('maps lift names to their muscle group', () => {
    expect(classifyExercise('bench 60 kg 3 set 10 tekrar').muscle_groups).toEqual(['göğüs'])
    expect(classifyExercise('80 kg squat 5x5').muscle_groups).toEqual(['bacak'])
    expect(classifyExercise('barfiks çektim').muscle_groups).toEqual(['sırt'])
    expect(classifyExercise('lateral raise 4 set').muscle_groups).toEqual(['omuz'])
    expect(classifyExercise('biceps curl').muscle_groups).toEqual(['kol'])
    expect(classifyExercise('mekik çektim').muscle_groups).toEqual(['karın'])
  })

  it('reads the group when the user names it directly', () => {
    expect(classifyExercise('bacak günü yaptım 12 set').muscle_groups).toEqual(['bacak'])
    expect(classifyExercise('göğüs ve omuz çalıştım').muscle_groups).toEqual(['göğüs', 'omuz'])
  })

  it('folds Turkish spelling', () => {
    expect(classifyExercise('GÖĞÜS günü').muscle_groups).toEqual(['göğüs'])
    expect(classifyExercise('gogus gunu').muscle_groups).toEqual(['göğüs'])
  })

  it('returns an empty list rather than forcing a group', () => {
    expect(classifyExercise('60 kg kaldırıyorum').muscle_groups).toEqual([])
    expect(classifyExercise('şu an yüzüyorum').muscle_groups).toEqual([])
    expect(classifyExercise('').muscle_groups).toEqual([])
  })

  it('picks the workout type from the verb', () => {
    expect(classifyExercise('şu an yüzüyorum').type).toBe('cardio')
    expect(classifyExercise('yarım saat koştum').type).toBe('cardio')
    expect(classifyExercise('bisiklete bindim').type).toBe('cardio')
    expect(classifyExercise('yarım saat yürüdüm').type).toBe('walk')
    expect(classifyExercise('80 kg squat 5x5').type).toBe('resistance')
    expect(classifyExercise('bugün dinlendim').type).toBe('rest')
    expect(classifyExercise('60 kg kaldırıyorum').type).toBe('resistance')
  })

  it('has no type to offer when the sentence says nothing about one', () => {
    expect(classifyExercise('bugün hava güzel').type).toBeNull()
  })

  it('does not let a muscle word inside another word match', () => {
    expect(classifyExercise('kolay geçti').muscle_groups).toEqual([])
  })
})

describe('fillWorkout', () => {
  const base = { summary: 'test' }

  it('leaves a draft without a workout alone', () => {
    expect(fillWorkout({ ...base, protein_g: 30 }, 'tavuk yedim')).toEqual({ ...base, protein_g: 30 })
    expect(fillWorkout(null, 'bench 60 kg')).toBeNull()
  })

  it('fills the muscle group the model left empty', () => {
    const filled = fillWorkout(
      { ...base, workout: { type: 'resistance', weight_kg: 60, muscle_groups: [] } },
      'bench 60 kg 3 set 10 tekrar',
    )
    expect(filled?.workout?.muscle_groups).toEqual(['göğüs'])
  })

  it('keeps what the model already said', () => {
    const filled = fillWorkout(
      { ...base, workout: { type: 'cardio', duration_min: 30, muscle_groups: ['bacak'] } },
      'bench 60 kg',
    )
    expect(filled?.workout?.muscle_groups).toEqual(['bacak'])
    expect(filled?.workout?.type).toBe('cardio')
  })

  it('repairs an invalid type from the sentence', () => {
    const filled = fillWorkout({ ...base, workout: { type: 'yuzme' as never, muscle_groups: [] } }, 'şu an yüzüyorum')
    expect(filled?.workout?.type).toBe('cardio')
  })

  it('adds no number the user did not say', () => {
    const filled = fillWorkout(
      { ...base, workout: { type: 'cardio', duration_min: null, muscle_groups: [] } },
      'şu an yüzüyorum',
    )
    expect(filled?.workout?.duration_min).toBeNull()
    expect(filled?.workout?.sets_total).toBeUndefined()
  })

  it('does not log the lifted weight as body weight', () => {
    const filled = fillWorkout(
      { ...base, weight_kg: 60, workout: { type: 'resistance', weight_kg: 60, muscle_groups: [] } },
      '60 kg kaldırıyorum',
    )
    expect(filled?.weight_kg).toBeNull()
    expect(filled?.workout?.weight_kg).toBe(60)
  })

  it('keeps a real scale reading that differs from the lift', () => {
    const filled = fillWorkout(
      { ...base, weight_kg: 82.4, workout: { type: 'resistance', weight_kg: 60, muscle_groups: [] } },
      'sabah 82.4 kg, bench 60 kg',
    )
    expect(filled?.weight_kg).toBe(82.4)
  })
})
