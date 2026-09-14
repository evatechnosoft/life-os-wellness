import { describe, expect, it } from 'vitest'

import { detectedExercise, segmentMuscles, segmentMusclesOf } from './watchExercise'

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

describe('segmentMuscles', () => {
  it('bench press gogus, deadlift sirt ve bacak', () => {
    expect(segmentMuscles(5)).toEqual(['göğüs'])
    expect(segmentMuscles(11)).toEqual(['sırt', 'bacak'])
  })

  it('hip thrust ve squat bacak, lat pulldown sirt', () => {
    expect(segmentMuscles(25)).toEqual(['bacak'])
    expect(segmentMuscles(51)).toEqual(['bacak'])
    expect(segmentMuscles(31)).toEqual(['sırt'])
  })

  it('tanimadigimiz ya da kas grubu olmayan tip icin uydurmaz', () => {
    expect(segmentMuscles(0)).toBeNull() // UNKNOWN
    expect(segmentMuscles(44)).toBeNull() // REST
    expect(segmentMuscles(39)).toBeNull() // PAUSE
    expect(segmentMuscles(46)).toBeNull() // RUNNING
    expect(segmentMuscles(65)).toBeNull() // WEIGHTLIFTING - hangi kas belli degil
    expect(segmentMuscles(999)).toBeNull() // sema disi
    expect(segmentMuscles(-1)).toBeNull()
  })

  it('esleseni birlestirir, tekrar etmez, sirayi korur', () => {
    // bench press + incline yok; bench(gogus) + deadlift(sirt,bacak) + squat(bacak)
    expect(segmentMusclesOf([5, 11, 51])).toEqual(['göğüs', 'sırt', 'bacak'])
  })

  it('hicbiri eslesmezse bos dizi doner - kayit kas grubusuz kalir', () => {
    expect(segmentMusclesOf([44, 39, 999])).toEqual([])
    expect(segmentMusclesOf([])).toEqual([])
  })
})
