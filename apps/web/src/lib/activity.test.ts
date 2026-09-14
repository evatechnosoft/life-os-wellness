import { describe, expect, it } from 'vitest'

import {
  ACTIVITY_METRIC,
  dailyMinutes,
  matchActivity,
  planHrWindows,
  type ActivityInterval,
} from './activity'

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

describe('matchActivity', () => {
  const now = day(2026, 9, 13, 23, 0)
  const win = (fromH: number, fromM: number, toH: number, toM: number) => ({
    startMs: day(2026, 9, 13, fromH, fromM),
    endMs: day(2026, 9, 13, toH, toM),
  })

  it('hareket verisi yoksa tip cikarilmaz - bugunku davranis, soru sorulur', () => {
    expect(matchActivity(win(14, 20, 14, 55), [], now)).toBeNull()
  })

  it('hic ortusmeyen hareket tip uretmez', () => {
    const intervals: ActivityInterval[] = [
      { type: 'running', startMs: day(2026, 9, 13, 8, 0), endMs: day(2026, 9, 13, 8, 40) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)).toBeNull()
  })

  it('tam ortusen kosu kardiyo olur', () => {
    const intervals: ActivityInterval[] = [
      { type: 'running', startMs: day(2026, 9, 13, 14, 18), endMs: day(2026, 9, 13, 14, 57) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)).toEqual({
      activity: 'running',
      type: 'cardio',
      label: 'koşu',
      overlapMin: 35,
    })
  })

  it('yuruyus kardiyo degil yuruyus kovasina duser', () => {
    const intervals: ActivityInterval[] = [
      { type: 'walking', startMs: day(2026, 9, 13, 14, 20), endMs: day(2026, 9, 13, 14, 55) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)?.type).toBe('walk')
  })

  it('esigin altinda kalan kismi ortusme tip uretmez', () => {
    // 35 dakikalik pencerenin yalniz 10 dakikasi -> %29, esik %50.
    const intervals: ActivityInterval[] = [
      { type: 'cycling', startMs: day(2026, 9, 13, 14, 20), endMs: day(2026, 9, 13, 14, 30) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)).toBeNull()
  })

  it('esigi tam tutturan kismi ortusme yeter', () => {
    const intervals: ActivityInterval[] = [
      { type: 'cycling', startMs: day(2026, 9, 13, 14, 20), endMs: day(2026, 9, 13, 14, 40) },
    ]
    expect(matchActivity(win(14, 20, 15, 0), intervals, now)?.activity).toBe('cycling')
  })

  it('ayni tipin parcali araliklari toplanir', () => {
    const intervals: ActivityInterval[] = [
      { type: 'walking', startMs: day(2026, 9, 13, 14, 20), endMs: day(2026, 9, 13, 14, 30) },
      { type: 'walking', startMs: day(2026, 9, 13, 14, 40), endMs: day(2026, 9, 13, 14, 55) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)?.overlapMin).toBe(25)
  })

  it('birden cok tip ortusurse en uzun ortusen kazanir', () => {
    const intervals: ActivityInterval[] = [
      { type: 'walking', startMs: day(2026, 9, 13, 14, 20), endMs: day(2026, 9, 13, 14, 30) },
      { type: 'running', startMs: day(2026, 9, 13, 14, 30), endMs: day(2026, 9, 13, 14, 55) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)?.activity).toBe('running')
  })

  it('esit ortusmede daha yogun hareket kazanir', () => {
    const intervals: ActivityInterval[] = [
      { type: 'walking', startMs: day(2026, 9, 13, 14, 20), endMs: day(2026, 9, 13, 14, 40) },
      { type: 'running', startMs: day(2026, 9, 13, 14, 40), endMs: day(2026, 9, 13, 15, 0) },
    ]
    expect(matchActivity(win(14, 20, 15, 0), intervals, now)?.activity).toBe('running')
  })

  it('hareketsizlik tip uretmez - agirlik seansi olabilir, sorulur', () => {
    const intervals: ActivityInterval[] = [
      { type: 'still', startMs: day(2026, 9, 13, 14, 0), endMs: day(2026, 9, 13, 15, 0) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)).toBeNull()
  })

  it('aracta gecen pencere antrenman degildir', () => {
    const intervals: ActivityInterval[] = [
      { type: 'in_vehicle', startMs: day(2026, 9, 13, 14, 0), endMs: day(2026, 9, 13, 15, 0) },
    ]
    expect(matchActivity(win(14, 20, 14, 55), intervals, now)).toEqual({
      activity: 'in_vehicle',
      type: null,
      label: 'araçta',
      overlapMin: 35,
    })
  })

  it('suren aralik simdiye kadar sayilir', () => {
    const intervals: ActivityInterval[] = [
      { type: 'running', startMs: day(2026, 9, 13, 22, 20), endMs: null },
    ]
    expect(matchActivity(win(22, 30, 22, 50), intervals, now)?.activity).toBe('running')
  })

  it('bozuk pencere null doner', () => {
    expect(matchActivity({ startMs: now, endMs: now }, [], now)).toBeNull()
  })
})

describe('planHrWindows', () => {
  const now = day(2026, 9, 13, 23, 0)
  const date = '2026-09-13'
  const w = (fromH: number, toH: number) => ({
    startMs: day(2026, 9, 13, fromH, 0),
    endMs: day(2026, 9, 13, toH, 0),
    date,
  })

  it('hareket verisi yokken gunde en fazla iki soru sorar', () => {
    const plans = planHrWindows([w(8, 9), w(12, 13), w(16, 17)], [], now)
    expect(plans).toHaveLength(2)
    expect(plans.every((p) => p.match === null)).toBe(true)
  })

  it('telefondan cikarilan pencereler soru sinirini tuketmez', () => {
    const intervals: ActivityInterval[] = [
      { type: 'running', startMs: day(2026, 9, 13, 8, 0), endMs: day(2026, 9, 13, 9, 0) },
      { type: 'cycling', startMs: day(2026, 9, 13, 12, 0), endMs: day(2026, 9, 13, 13, 0) },
    ]
    const plans = planHrWindows([w(8, 9), w(12, 13), w(16, 17), w(20, 21)], intervals, now)
    // Iki tanesi onay (sinira girmez), kalan ikisi soru - sinir tam dolar.
    expect(plans.map((p) => p.match?.activity ?? null)).toEqual(['running', 'cycling', null, null])
  })

  it('aractaki pencere ne sorulur ne kaydedilir', () => {
    const intervals: ActivityInterval[] = [
      { type: 'in_vehicle', startMs: day(2026, 9, 13, 8, 0), endMs: day(2026, 9, 13, 9, 0) },
    ]
    const plans = planHrWindows([w(8, 9), w(12, 13), w(16, 17)], intervals, now)
    // Arac dusuyor; kalan iki pencere soru sinirini doldurur.
    expect(plans.map((p) => p.window.startMs)).toEqual([w(12, 13).startMs, w(16, 17).startMs])
  })

  it('gunler kendi sinirini tasir', () => {
    const other = { startMs: day(2026, 9, 12, 8, 0), endMs: day(2026, 9, 12, 9, 0), date: '2026-09-12' }
    const plans = planHrWindows([w(8, 9), w(12, 13), w(16, 17), other], [], now)
    expect(plans).toHaveLength(3)
  })
})
