import { describe, expect, test } from 'vitest'

import { ApiError } from './api'
import { verdictFor } from './store'

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
