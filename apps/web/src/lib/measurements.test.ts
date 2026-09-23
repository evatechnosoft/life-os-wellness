import { describe, expect, test } from 'vitest'

import type { Measurement } from './db'
import { dayValue, summary } from './measurements'

const m = (time: string, sys: number | null, dia: number | null, extra: Partial<Measurement> = {}): Measurement => ({
  id: time,
  date: '2026-09-23',
  time,
  bp_systolic: sys,
  bp_diastolic: dia,
  pulse: null,
  weight_kg: null,
  note: null,
  ...extra,
})

describe('dayValue', () => {
  test('sabah olcumleri ortalanir, gun ici olculer hesaba girmez', () => {
    // 23 Eyl'in gercek verisi: sabah 122/82, ogleden sonra 134/90 ve 128/78.
    const value = dayValue([m('07:51', 122, 82), m('13:52', 134, 90), m('13:58', 128, 78)])
    expect(value).toMatchObject({ bp_systolic: 122, bp_diastolic: 82, morning: true, count: 1 })
  })

  test('iki sabah olcumu ortalanir', () => {
    const value = dayValue([m('07:40', 128, 80), m('07:42', 124, 78)])
    expect(value).toMatchObject({ bp_systolic: 126, bp_diastolic: 79, count: 2 })
  })

  test('sabah olcumu yoksa gun kaybolmaz, tumunun ortalamasi doner', () => {
    const value = dayValue([m('13:52', 134, 90), m('20:10', 130, 86)])
    expect(value).toMatchObject({ bp_systolic: 132, bp_diastolic: 88, morning: false, count: 2 })
  })

  test('kilo sabahla sinirli degil - aksam tartisi da gunun kilosu', () => {
    const value = dayValue([m('07:51', 122, 82), m('21:00', null, null, { weight_kg: 107.8 })])
    expect(value?.weight_kg).toBe(107.8)
    expect(value?.bp_systolic).toBe(122)
  })

  test('bos gun null doner', () => {
    expect(dayValue([])).toBeNull()
  })

  test('11:00 sabah sayilir, 11:01 sayilmaz', () => {
    expect(dayValue([m('11:00', 120, 80), m('11:01', 140, 90)])).toMatchObject({ bp_systolic: 120, count: 1 })
  })
})

describe('summary', () => {
  test('olcum yoksa soylenir', () => {
    expect(summary(null)).toBe('ölçüm yok')
  })

  test('tansiyon, nabiz ve kilo tek satirda', () => {
    const value = dayValue([m('07:50', 128, 78, { pulse: 66, weight_kg: 107.8 })])
    expect(summary(value)).toBe('128/78 · 66 bpm · 107.8 kg (1 sabah ölçümü)')
  })
})
