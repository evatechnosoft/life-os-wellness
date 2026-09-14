import { describe, expect, it } from 'vitest'

import { detectedExercise } from './watchExercise'

describe('detectedExercise', () => {
  it('kuvvet antrenmanini direnc kovasina koyar', () => {
    expect(detectedExercise('STRENGTH_TRAINING')).toEqual({ type: 'resistance', label: 'Kuvvet antrenmanı' })
    expect(detectedExercise('WEIGHTLIFTING')).toEqual({ type: 'resistance', label: 'Ağırlık' })
  })

  it('yuruyus ve dogada yurumeyi ayirir ama ikisi de yuruyustur', () => {
    expect(detectedExercise('WALKING')).toEqual({ type: 'walk', label: 'Yürüyüş' })
    expect(detectedExercise('HIKING')).toEqual({ type: 'walk', label: 'Doğa yürüyüşü' })
  })

  it('yuzme ve kosu kardiyodur', () => {
    expect(detectedExercise('SWIMMING_POOL')?.type).toBe('cardio')
    expect(detectedExercise('SWIMMING_POOL')?.label).toBe('Yüzme')
    expect(detectedExercise('RUNNING')).toEqual({ type: 'cardio', label: 'Koşu' })
  })

  it('buyuk kucuk harf ve bosluk farkini yutar', () => {
    expect(detectedExercise('swimming_pool')?.label).toBe('Yüzme')
    expect(detectedExercise(' Running ')?.label).toBe('Koşu')
  })

  it('bizim dort kovamiza sigmayan tip icin uydurmaz', () => {
    // Yoga/pilates gercek antrenman ama ne direnc ne kardiyo; kullanici soyler.
    expect(detectedExercise('YOGA')).toBeNull()
    expect(detectedExercise('PILATES')).toBeNull()
    expect(detectedExercise('OTHER')).toBeNull()
    expect(detectedExercise('')).toBeNull()
    expect(detectedExercise('QUIDDITCH')).toBeNull()
  })

  it('eski regex tuzagi: GYMNASTICS "gym" diye direnc sayilmaz', () => {
    expect(detectedExercise('GYMNASTICS')).toBeNull()
  })
})
