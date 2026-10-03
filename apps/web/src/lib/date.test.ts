import { describe, expect, test } from 'vitest'

import { daysBetween, lastDates, shiftDate, toLocalDate } from './date'

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

describe('daysBetween', () => {
  test('counts whole local days forward', () => {
    expect(daysBetween('2026-01-01', '2026-01-08')).toBe(7)
  })

  test('is negative when the second date is earlier', () => {
    expect(daysBetween('2026-01-08', '2026-01-01')).toBe(-7)
  })

  test('crosses a DST change without half days', () => {
    // 2026-03-29 is the European DST jump; the arithmetic must stay whole days.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })

  test('the same day is zero', () => {
    expect(daysBetween('2026-02-28', '2026-02-28')).toBe(0)
  })
})

describe('shiftDate', () => {
  test('moves across month and year boundaries', () => {
    expect(shiftDate('2026-10-01', -1)).toBe('2026-09-30')
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01')
    expect(shiftDate('2028-02-28', 1)).toBe('2028-02-29')
  })

  test('zero keeps the day', () => {
    expect(shiftDate('2026-10-03', 0)).toBe('2026-10-03')
  })
})
