import { describe, expect, test } from 'vitest'

import type { DailyLog } from './db'
import { nextFireAt, notificationsFor, pendingReminders, REMINDER_ACTIONS, type ReminderSettings } from './reminders'

const times: ReminderSettings = { enabled: true, weigh_at: '09:00', retro_at: '21:00', waist_day: 1 }
const log = (fields: Partial<DailyLog> = {}): DailyLog => ({ date: '2026-09-13', updated_at: '', ...fields })

describe('pendingReminders', () => {
  test('tarti saati gelmeden hatirlatmaz', () => {
    expect(pendingReminders({ log: undefined, now: '08:59', settings: times })).toEqual([])
  })

  test('saat gelmis ve kilo girilmemisse tartiyi hatirlatir', () => {
    const due = pendingReminders({ log: undefined, now: '09:00', settings: times })
    expect(due.map((r) => r.id)).toEqual(['weigh'])
  })

  test('kilo girilmisse hatirlatmaz', () => {
    expect(pendingReminders({ log: log({ weight_kg: 70 }), now: '12:00', settings: times })).toEqual([])
  })

  test('aksam retrosu artik sorulmaz (4 Eki kaldirildi) - yalniz eksik tarti', () => {
    const due = pendingReminders({ log: undefined, now: '21:30', settings: times })
    expect(due.map((r) => r.id)).toEqual(['weigh'])
  })

  test('kapaliyken hicbir sey vermez', () => {
    const off = { ...times, enabled: false }
    expect(pendingReminders({ log: undefined, now: '23:00', settings: off })).toEqual([])
  })

  test('saat karsilastirmasi metin degil dakika uzerinden - 9:05 > 09:00', () => {
    const late = { ...times, weigh_at: '9:05' }
    expect(pendingReminders({ log: undefined, now: '09:10', settings: late }).map((r) => r.id)).toEqual(['weigh'])
    expect(pendingReminders({ log: undefined, now: '09:00', settings: late })).toEqual([])
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
    expect(ask({ log: { date: '2026-09-14', weight_kg: 84, updated_at: '' }, now: '09:30', settings, weekday: 1 }))
      .toContain('waist')
  })

  test('baska gunlerde sorulmaz', () => {
    expect(ask({ log: { date: '2026-09-15', weight_kg: 84, updated_at: '' }, now: '09:30', settings, weekday: 2 }))
      .not.toContain('waist')
  })

  test('bugun olculmusse ya da hafta icinde olculmusse tekrar sorulmaz', () => {
    const log = { date: '2026-09-14', weight_kg: 84, waist_cm: 101, updated_at: '' }
    expect(ask({ log, now: '09:30', settings, weekday: 1 })).not.toContain('waist')
    expect(ask({
      log: { date: '2026-09-14', weight_kg: 84, updated_at: '' },
      now: '09:30', settings, weekday: 1, waist_logged_this_week: true,
    })).not.toContain('waist')
  })

  test('tarti saatinden once sorulmaz - ikisi de ac karnina', () => {
    expect(ask({ log: undefined, now: '07:00', settings, weekday: 1 })).not.toContain('waist')
  })

  test('gun bilinmiyorsa sorulmaz', () => {
    expect(ask({ log: undefined, now: '09:30', settings })).not.toContain('waist')
  })
})

describe('aksam hatirlatmasi yok (4 Eki: ogunler sohbetten)', () => {
  test('gece de yalniz eksik tarti sorulur', () => {
    expect(pendingReminders({ log: log({ weight_kg: 100 }), now: '22:00', settings: times })).toEqual([])
  })
})

describe('gecilen hatirlatma', () => {
  test('bugun gecilen kart bir daha gosterilmez', () => {
    const due = pendingReminders({ log: undefined, now: '21:30', settings: times, skipped: ['weigh'] })
    expect(due).toEqual([])
  })
})

describe('notificationsFor', () => {
  const now = new Date(2026, 8, 29, 20, 50)
  const none = { weigh: false }

  // Eklenti `at` + repeats'te araligi `at - simdi` alir: 20:50'de kurulunca 21:00
  // bildirimi 10 dakikada bir, 09:00'da kurulunca aksam bildirimi sabah da calar.
  test('tek seferlik kurar - tekrar araligi yok', () => {
    for (const n of notificationsFor(times, none, now)) {
      expect(n.schedule).toEqual({ at: n.schedule.at, allowWhileIdle: true })
    }
  })

  test('bildirimde Cevapla / Gec dugmeleri; hangi hatirlatma oldugu ekte (Dean 2 Eki)', () => {
    for (const n of notificationsFor(times, none, now)) {
      expect(n.actionTypeId).toBe(REMINDER_ACTIONS)
      expect(n.extra.id).toBe('weigh')
    }
  })

  test('yapilan ya da gecilen bugun calmaz, yarina kurulur', () => {
    const [weigh] = notificationsFor(times, { weigh: true }, now)
    expect(weigh?.schedule.at).toEqual(new Date(2026, 8, 30, 9, 0))
  })

  test('yalniz sabah tartisi kurulur - retro ve aksam yemegi yok', () => {
    expect(notificationsFor(times, none, now).map((n) => n.extra.id)).toEqual(['weigh'])
  })
})
