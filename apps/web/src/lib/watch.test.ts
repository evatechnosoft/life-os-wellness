import { beforeEach, describe, expect, it, vi } from 'vitest'

const { checkUpdate, version } = vi.hoisted(() => ({
  checkUpdate: vi.fn(),
  version: vi.fn(async () => ({ versionName: '0.15.0', versionCode: 1500 })),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
  registerPlugin: () => ({ checkUpdate, version }),
}))

import { autoCheckPhoneUpdate, parseWatchRecords } from './watch'

const store = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
})

const line = (date: string, metrics: Record<string, unknown>, ts: number): string =>
  JSON.stringify({ date, metrics: JSON.stringify(metrics), ts })

describe('parseWatchRecords', () => {
  it('groups a day into one metrics write', () => {
    expect(parseWatchRecords([line('2026-09-14', { watch_hr_bpm: 71 }, 1)])).toEqual([
      { date: '2026-09-14', metrics: { watch_hr_bpm: 71 } },
    ])
  })

  it('keeps the newest reading when the watch sent a metric twice', () => {
    const raw = [line('2026-09-14', { watch_hr_bpm: 71 }, 1), line('2026-09-14', { watch_hr_bpm: 88 }, 2)]
    expect(parseWatchRecords(raw)).toEqual([{ date: '2026-09-14', metrics: { watch_hr_bpm: 88 } }])
  })

  it('does not let a late-arriving older record overwrite a newer one', () => {
    const raw = [line('2026-09-14', { watch_hr_bpm: 88 }, 2), line('2026-09-14', { watch_hr_bpm: 71 }, 1)]
    expect(parseWatchRecords(raw)).toEqual([{ date: '2026-09-14', metrics: { watch_hr_bpm: 88 } }])
  })

  it('separates days', () => {
    const raw = [line('2026-09-13', { watch_hr_bpm: 60 }, 1), line('2026-09-14', { watch_hr_bpm: 70 }, 2)]
    expect(parseWatchRecords(raw)).toEqual([
      { date: '2026-09-13', metrics: { watch_hr_bpm: 60 } },
      { date: '2026-09-14', metrics: { watch_hr_bpm: 70 } },
    ])
  })

  it('drops garbage instead of poisoning the day', () => {
    const raw = [
      'not json',
      line('14.09.2026', { watch_hr_bpm: 70 }, 1),
      line('2026-09-14', { watch_hr_bpm: 'high' }, 2),
      line('2026-09-14', { watch_hr_bpm: Number.NaN }, 3),
      line('2026-09-14', { watch_hr_bpm: 70 }, 4),
    ]
    expect(parseWatchRecords(raw)).toEqual([{ date: '2026-09-14', metrics: { watch_hr_bpm: 70 } }])
  })

  it('an all-garbage queue writes nothing', () => {
    expect(parseWatchRecords(['{}', 'null'])).toEqual([])
  })
})

/**
 * Gunde bir kontrol: kullaniciyi rahatsiz etmemek icin. Kapi bozulursa ya her acilista ag
 * isi yapilir ya da gercek bir guncelleme bir gun boyunca gorulmez.
 */
describe('autoCheckPhoneUpdate', () => {
  beforeEach(() => {
    store.clear()
    checkUpdate.mockReset()
  })

  it('kurulu surum degisince onbellegi atar - kurulan guncelleme bant olarak kalmaz', async () => {
    checkUpdate.mockResolvedValue({ state: 'available', versionName: '0.16.0' })
    await autoCheckPhoneUpdate()
    version.mockResolvedValueOnce({ versionName: '0.16.0', versionCode: 1600 })
    checkUpdate.mockResolvedValue({ state: 'upToDate' })
    expect(await autoCheckPhoneUpdate()).toEqual({ state: 'upToDate' })
    expect(checkUpdate).toHaveBeenCalledTimes(2)
  })

  it('asks once, then serves the cached answer for a day', async () => {
    checkUpdate.mockResolvedValue({ state: 'available', versionName: '0.16.0' })
    expect(await autoCheckPhoneUpdate()).toEqual({ state: 'available', versionName: '0.16.0' })
    expect(await autoCheckPhoneUpdate()).toEqual({ state: 'available', versionName: '0.16.0' })
    expect(checkUpdate).toHaveBeenCalledTimes(1)
  })

  it('asks again once the day is over', async () => {
    checkUpdate.mockResolvedValue({ state: 'upToDate' })
    await autoCheckPhoneUpdate()
    store.set('phone_update', JSON.stringify({ at: Date.now() - 25 * 60 * 60 * 1000, result: { state: 'upToDate' } }))
    await autoCheckPhoneUpdate()
    expect(checkUpdate).toHaveBeenCalledTimes(2)
  })

  it('does not cache a failed check - no network must not hide an update for a day', async () => {
    checkUpdate.mockResolvedValue({ state: 'blocked', reason: 'manifest indirilemedi' })
    await autoCheckPhoneUpdate()
    await autoCheckPhoneUpdate()
    expect(checkUpdate).toHaveBeenCalledTimes(2)
  })

  it('survives a corrupted cache entry instead of throwing', async () => {
    store.set('phone_update', 'not json')
    checkUpdate.mockResolvedValue({ state: 'upToDate' })
    expect(await autoCheckPhoneUpdate()).toEqual({ state: 'upToDate' })
  })
})
