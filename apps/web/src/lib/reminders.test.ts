import { describe, expect, test } from 'vitest'

import type { DailyLog, Retro } from './db'
import { nextFireAt, pendingReminders, type ReminderSettings } from './reminders'

const times: ReminderSettings = { enabled: true, weigh_at: '09:00', retro_at: '21:00', waist_day: 1 }
const log = (fields: Partial<DailyLog> = {}): DailyLog => ({ date: '2026-09-13', updated_at: '', ...fields })
const retro = (fields: Partial<Retro> = {}): Retro => ({ date: '2026-09-13', updated_at: '', ...fields })

describe('pendingReminders', () => {
  test('tarti saati gelmeden hatirlatmaz', () => {
    expect(pendingReminders({ log: undefined, retro: undefined, now: '08:59', settings: times })).toEqual([])
  })

  test('saat gelmis ve kilo girilmemisse tartiyi hatirlatir', () => {
    const due = pendingReminders({ log: undefined, retro: undefined, now: '09:00', settings: times })
    expect(due.map((r) => r.id)).toEqual(['weigh'])
  })

  test('kilo girilmisse hatirlatmaz', () => {
    expect(pendingReminders({ log: log({ weight_kg: 70 }), retro: undefined, now: '12:00', settings: times })).toEqual([])
  })

  test('aksam ikisi de acikken ikisini birden verir', () => {
    const due = pendingReminders({ log: undefined, retro: undefined, now: '21:30', settings: times })
    expect(due.map((r) => r.id)).toEqual(['weigh', 'retro'])
  })

  test('retronun tek alani dolu olsa da yeter - yarim birakilan yeniden sorulmaz', () => {
    const due = pendingReminders({ log: log({ weight_kg: 70 }), retro: retro({ went_well: 'iyiydi' }), now: '22:00', settings: times })
    expect(due).toEqual([])
  })

  test('bos metinli retro dolu sayilmaz', () => {
    const due = pendingReminders({ log: log({ weight_kg: 70 }), retro: retro({ went_well: '  ' }), now: '22:00', settings: times })
    expect(due.map((r) => r.id)).toEqual(['retro'])
  })

  test('kapaliyken hicbir sey vermez', () => {
    const off = { ...times, enabled: false }
    expect(pendingReminders({ log: undefined, retro: undefined, now: '23:00', settings: off })).toEqual([])
  })

  test('saat karsilastirmasi metin degil dakika uzerinden - 9:05 > 09:00', () => {
    const late = { ...times, weigh_at: '9:05' }
    expect(pendingReminders({ log: undefined, retro: undefined, now: '09:10', settings: late }).map((r) => r.id)).toEqual(['weigh'])
    expect(pendingReminders({ log: undefined, retro: undefined, now: '09:00', settings: late })).toEqual([])
  })
})

/** Yerel saat alanlariyla karsilastirir; toISOString() gunu kaydirirdi. */
const at = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`

describe('nextFireAt', () => {
  test('veri yok ve saat gelmemisse bugun atesler', () => {
    const now = new Date(2026, 8, 13, 7, 30)
    expect(at(nextFireAt('09:00', false, now))).toBe('2026-9-13 9:0')
  })

  test('o gun veri girilmisse bugunu atlar', () => {
    const now = new Date(2026, 8, 13, 7, 30)
    expect(at(nextFireAt('09:00', true, now))).toBe('2026-9-14 9:0')
  })

  test('bildirim saati gectiyse yarina kurar', () => {
    const now = new Date(2026, 8, 13, 9, 0)
    expect(at(nextFireAt('09:00', false, now))).toBe('2026-9-14 9:0')
  })

  test('veri hatirlatmadan sonra girildiyse yine yarin', () => {
    const now = new Date(2026, 8, 13, 10, 15)
    expect(at(nextFireAt('09:00', true, now))).toBe('2026-9-14 9:0')
  })

  test('ay sonunda ertesi gun sonraki aya tasar', () => {
    const now = new Date(2026, 8, 30, 22, 0)
    expect(at(nextFireAt('21:00', false, now))).toBe('2026-10-1 21:0')
  })
})

describe('bel hatirlatmasi', () => {
  const settings = { enabled: true, weigh_at: '09:00', retro_at: '21:00', waist_day: 1 }
  const ask = (patch: Parameters<typeof pendingReminders>[0]) => pendingReminders(patch).map((r) => r.id)

  test('gunu geldiginde ve o hafta olculmediyse sorulur', () => {
    expect(ask({ log: { date: '2026-09-14', weight_kg: 84, updated_at: '' }, retro: undefined, now: '09:30', settings, weekday: 1 }))
      .toContain('waist')
  })

  test('baska gunlerde sorulmaz', () => {
    expect(ask({ log: { date: '2026-09-15', weight_kg: 84, updated_at: '' }, retro: undefined, now: '09:30', settings, weekday: 2 }))
      .not.toContain('waist')
  })

  test('bugun olculmusse ya da hafta icinde olculmusse tekrar sorulmaz', () => {
    const log = { date: '2026-09-14', weight_kg: 84, waist_cm: 101, updated_at: '' }
    expect(ask({ log, retro: undefined, now: '09:30', settings, weekday: 1 })).not.toContain('waist')
    expect(ask({
      log: { date: '2026-09-14', weight_kg: 84, updated_at: '' },
      retro: undefined, now: '09:30', settings, weekday: 1, waist_logged_this_week: true,
    })).not.toContain('waist')
  })

  test('tarti saatinden once sorulmaz - ikisi de ac karnina', () => {
    expect(ask({ log: undefined, retro: undefined, now: '07:00', settings, weekday: 1 })).not.toContain('waist')
  })

  test('gun bilinmiyorsa sorulmaz', () => {
    expect(ask({ log: undefined, retro: undefined, now: '09:30', settings })).not.toContain('waist')
  })
})
