import { describe, expect, test } from 'vitest'

import { ApiError } from './api'
import { verdictFor, withMealProtein } from './store'

// The drain stops at the first entry it cannot send, so this verdict decides whether a
// single bad write freezes every write queued after it. That is the failure mode the
// app has to not have.
describe('verdictFor', () => {
  test('ag yoksa kuyrukta kalir', () => {
    expect(verdictFor(new TypeError('Failed to fetch'), 'PUT')).toBe('retry')
  })

  test('sunucu hatasi gecicidir', () => {
    for (const status of [500, 502, 503]) {
      expect(verdictFor(new ApiError(status, 'bad'), 'POST')).toBe('retry')
    }
  })

  test('hiz siniri ve zaman asimi beklenir', () => {
    expect(verdictFor(new ApiError(429, 'too_many_requests'), 'POST')).toBe('retry')
    expect(verdictFor(new ApiError(408, 'timeout'), 'POST')).toBe('retry')
  })

  // Yanlis token gecici bir durumdur; kuyrugu bosaltmak Dean'in yazdiklarini yer.
  test('yetki hatasi kuyrugu silmez', () => {
    expect(verdictFor(new ApiError(401, 'unauthorized'), 'PUT')).toBe('retry')
    expect(verdictFor(new ApiError(403, 'forbidden'), 'PUT')).toBe('retry')
  })

  test('zaten silinmis satiri silmek basarilidir', () => {
    expect(verdictFor(new ApiError(404, 'not found'), 'DELETE')).toBe('done')
  })

  // Asil dert bu: sunucunun semasinin reddettigi bir govde yarin da reddedilecek.
  // Kuyrukta tutmak onu degil, arkasindaki her yazmayi kaybettirir.
  test('reddedilen govde kuyrugu tikamaz', () => {
    expect(verdictFor(new ApiError(400, 'body/weight_kg must be <= 400'), 'PUT')).toBe('rejected')
    expect(verdictFor(new ApiError(422, 'unprocessable'), 'POST')).toBe('rejected')
    expect(verdictFor(new ApiError(404, 'not found'), 'PUT')).toBe('rejected')
  })
})

describe('withMealProtein', () => {
  const at = '2026-10-02T00:00:00Z'
  const meal = (date: string, protein_g: number | null) => ({ id: `${date}-${protein_g}`, date, time: '12:00', protein_g, kcal: null, note: null, estimated: true })

  test('sohbetten yazilan ogunler gunun proteinine sayilir (2 Eki: ogunler 177 g, halka 0)', () => {
    const out = withMealProtein([{ date: '2026-10-02', weight_kg: 107.9, updated_at: at }], [meal('2026-10-02', 45), meal('2026-10-02', 132)], at)
    expect(out).toEqual([{ date: '2026-10-02', weight_kg: 107.9, protein_g: 177, updated_at: at }])
  })

  test('elle eklenen protein ogun toplamindan buyukse korunur', () => {
    const out = withMealProtein([{ date: '2026-10-01', protein_g: 200, updated_at: at }], [meal('2026-10-01', 150)], at)
    expect(out[0]!.protein_g).toBe(200)
  })

  test('gunluk satiri olmayan ogun gunu de satir alir', () => {
    expect(withMealProtein([], [meal('2026-09-30', 60), meal('2026-09-30', null)], at)).toEqual([{ date: '2026-09-30', protein_g: 60, updated_at: at }])
  })
})
