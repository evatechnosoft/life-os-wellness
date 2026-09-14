import { describe, expect, it } from 'vitest'

import { ACTIVITY_METRIC, dailyMinutes } from './activity'

/** 2026-09-13 yerel gece yarisi - testler yerel saat diliminde tutarli kalsin diye. */
const day = (y: number, m: number, d: number, h = 0, min = 0): number =>
  new Date(y, m - 1, d, h, min).getTime()

describe('dailyMinutes', () => {
  const now = day(2026, 9, 13, 23, 0)

  it('aralik yoksa gun yoktur', () => {
    expect(dailyMinutes([], now)).toEqual({})
  })

  it('bir araligi dakikaya cevirip gune yazar', () => {
    const out = dailyMinutes([{ type: 'running', startMs: day(2026, 9, 13, 7, 0), endMs: day(2026, 9, 13, 7, 42) }], now)
    expect(out).toEqual({ '2026-09-13': { [ACTIVITY_METRIC.running]: 42 } })
  })

  it('ayni tipin araliklarini toplar, farkli tipleri ayri tutar', () => {
    const out = dailyMinutes(
      [
        { type: 'walking', startMs: day(2026, 9, 13, 8, 0), endMs: day(2026, 9, 13, 8, 20) },
        { type: 'walking', startMs: day(2026, 9, 13, 18, 0), endMs: day(2026, 9, 13, 18, 25) },
        { type: 'in_vehicle', startMs: day(2026, 9, 13, 9, 0), endMs: day(2026, 9, 13, 9, 30) },
      ],
      now,
    )
    expect(out).toEqual({
      '2026-09-13': { [ACTIVITY_METRIC.walking]: 45, [ACTIVITY_METRIC.in_vehicle]: 30 },
    })
  })

  it('suren aralik simdiye kadar sayilir', () => {
    const out = dailyMinutes([{ type: 'cycling', startMs: day(2026, 9, 13, 22, 30), endMs: null }], now)
    expect(out).toEqual({ '2026-09-13': { [ACTIVITY_METRIC.cycling]: 30 } })
  })

  it('gunler ayri satirdir', () => {
    const out = dailyMinutes(
      [
        { type: 'still', startMs: day(2026, 9, 12, 10, 0), endMs: day(2026, 9, 12, 11, 0) },
        { type: 'still', startMs: day(2026, 9, 13, 10, 0), endMs: day(2026, 9, 13, 10, 30) },
      ],
      now,
    )
    expect(out).toEqual({
      '2026-09-12': { [ACTIVITY_METRIC.still]: 60 },
      '2026-09-13': { [ACTIVITY_METRIC.still]: 30 },
    })
  })

  it('gece yarisini asan aralik basladigi gune yazilir', () => {
    const out = dailyMinutes(
      [{ type: 'in_vehicle', startMs: day(2026, 9, 12, 23, 30), endMs: day(2026, 9, 13, 0, 30) }],
      now,
    )
    expect(out).toEqual({ '2026-09-12': { [ACTIVITY_METRIC.in_vehicle]: 60 } })
  })

  it('bitisi baslangictan onceki bozuk aralik atilir', () => {
    const out = dailyMinutes([{ type: 'walking', startMs: day(2026, 9, 13, 9, 0), endMs: day(2026, 9, 13, 8, 0) }], now)
    expect(out).toEqual({})
  })

  it('gelecekteki suren aralik negatif dakika uretmez', () => {
    const out = dailyMinutes([{ type: 'running', startMs: now + 60_000, endMs: null }], now)
    expect(out).toEqual({})
  })
})
