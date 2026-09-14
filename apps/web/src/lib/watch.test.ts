import { describe, expect, it } from 'vitest'

import { parseWatchRecords } from './watch'

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
