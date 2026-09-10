import { describe, expect, test } from 'vitest'

import { lastDates, toLocalDate } from './date'

describe('toLocalDate', () => {
  test('uses the local calendar day, not UTC', () => {
    // 23:30 local on the 1st is already the 2nd in UTC for negative offsets.
    expect(toLocalDate(new Date(2026, 0, 1, 23, 30))).toBe('2026-01-01')
    expect(toLocalDate(new Date(2026, 0, 1, 0, 15))).toBe('2026-01-01')
  })

  test('pads month and day', () => {
    expect(toLocalDate(new Date(2026, 8, 5))).toBe('2026-09-05')
  })
})

describe('lastDates', () => {
  test('returns an inclusive ascending window', () => {
    expect(lastDates(7, new Date(2026, 0, 7))).toEqual([
      '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04',
      '2026-01-05', '2026-01-06', '2026-01-07',
    ])
  })

  test('crosses a month boundary', () => {
    expect(lastDates(3, new Date(2026, 2, 1))).toEqual(['2026-02-27', '2026-02-28', '2026-03-01'])
  })
})
