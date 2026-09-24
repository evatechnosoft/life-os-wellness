import { describe, expect, it } from 'vitest'

import type { Workout } from './db'
import { buildWorkout, bump, musclesFor, prefill, type LogRow } from './sessionLog'

let n = 0
const id = () => `id-${++n}`

const past: Workout[] = [
  {
    id: 'w1', date: '2026-09-14', type: 'resistance', muscle_groups: [],
    sets: [
      { id: 's1', exercise_id: 'Leg_Press', set_no: 1, weight_kg: 80, reps: 12, done_at: null },
    ],
  },
  {
    id: 'w2', date: '2026-09-21', type: 'resistance', muscle_groups: [],
    sets: [
      { id: 's2', exercise_id: 'Leg_Press', set_no: 1, weight_kg: 90, reps: 12, done_at: null },
      { id: 's3', exercise_id: 'Leg_Press', set_no: 2, weight_kg: 95, reps: 10, done_at: null },
    ],
  },
]

describe('prefill', () => {
  it('her hareket icin plandaki set sayisi kadar satir, son seansin degeriyle', () => {
    const rows = prefill([{ id: 'Leg_Press', sets: 3 }], past, '2026-09-25', id)
    expect(rows.map((r) => [r.set_no, r.weight_kg, r.reps])).toEqual([
      [1, 90, 12],
      [2, 95, 10],
      // gecen sefer 2 set vardi: ucuncu set son setin degerini alir
      [3, 95, 10],
    ])
    expect(rows.every((r) => r.done_at === null)).toBe(true)
  })

  it('bugunku ve gelecekteki seans "gecen sefer" sayilmaz', () => {
    const rows = prefill([{ id: 'Leg_Press', sets: 1 }], past, '2026-09-21', id)
    expect(rows[0]?.weight_kg).toBe(80)
  })

  it('hic yapilmamis hareket bos baslar, set sayisi yoksa 3', () => {
    const rows = prefill([{ id: 'Dead_Bug' }], past, '2026-09-25', id)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ exercise_id: 'Dead_Bug', weight_kg: null, reps: null })
  })
})

describe('bump', () => {
  const row: LogRow = { id: 'r', exercise_id: 'x', set_no: 1, weight_kg: 45, reps: 12, done_at: null }

  it('agirlik 2.5 kg adimla, tekrar 1 adimla degisir', () => {
    expect(bump(row, 'weight_kg', 1).weight_kg).toBe(47.5)
    expect(bump(row, 'reps', -1).reps).toBe(11)
  })

  it('sifirin altina inmez, bos alan 0dan baslar', () => {
    expect(bump({ ...row, weight_kg: 0 }, 'weight_kg', -1).weight_kg).toBe(0)
    expect(bump({ ...row, reps: null }, 'reps', 1).reps).toBe(1)
  })
})

describe('musclesFor', () => {
  it('katalog kaslarini BodyPicker gruplarina cevirir, tekrarsiz', () => {
    expect(musclesFor(['Leg_Press', 'Machine_Bicep_Curl', 'Machine_Triceps_Extension']).sort()).toEqual(['bacak', 'kol'])
  })

  it('bilinmeyen hareket sessizce atlanir', () => {
    expect(musclesFor(['Yok_Boyle_Hareket'])).toEqual([])
  })
})

describe('buildWorkout', () => {
  const rows: LogRow[] = [
    { id: 'a', exercise_id: 'Leg_Press', set_no: 1, weight_kg: 90, reps: 12, done_at: '2026-09-25T08:00:00Z' },
    { id: 'b', exercise_id: 'Leg_Press', set_no: 2, weight_kg: 95, reps: 10, done_at: '2026-09-25T08:03:00Z' },
    { id: 'c', exercise_id: 'Leg_Press', set_no: 3, weight_kg: 95, reps: 10, done_at: null },
  ]

  it('yalniz yapilan setler gider; toplamlar ve kas gruplari turetilir, onayli', () => {
    const w = buildWorkout('w9', '2026-09-25', rows, undefined)
    expect(w).toMatchObject({
      id: 'w9', date: '2026-09-25', type: 'resistance',
      sets_total: 2, reps_total: 22, needs_review: false, muscle_groups: ['bacak'],
    })
    expect(w.sets?.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('saatin buldugu seansin suresini ve notunu korur', () => {
    const base: Workout = {
      id: 'watch', date: '2026-09-25', type: 'cardio', duration_min: 52, muscle_groups: [],
      needs_review: true, notes: 'saat: Kuvvet antrenmanı',
    }
    const w = buildWorkout('watch', '2026-09-25', rows, base)
    expect(w).toMatchObject({ id: 'watch', type: 'resistance', duration_min: 52, notes: 'saat: Kuvvet antrenmanı' })
  })
})
