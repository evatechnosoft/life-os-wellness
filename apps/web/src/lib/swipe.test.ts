import { describe, expect, test } from 'vitest'

import { swipeAction, SWIPE_THRESHOLD } from './swipe'

describe('swipeAction', () => {
  test('saga yeterince kaydirma duzenler', () => {
    expect(swipeAction(SWIPE_THRESHOLD, 0)).toBe('edit')
  })

  test('sola yeterince kaydirma siler', () => {
    expect(swipeAction(-SWIPE_THRESHOLD, 0)).toBe('delete')
  })

  test('esigin altinda hicbir sey olmaz', () => {
    expect(swipeAction(SWIPE_THRESHOLD - 1, 0)).toBeNull()
    expect(swipeAction(-(SWIPE_THRESHOLD - 1), 0)).toBeNull()
  })

  // Liste dikey kayarken parmak biraz yana da gider; bu bir silme olmamali.
  test('dikey agirlikli hareket kaydirma sayilmaz', () => {
    expect(swipeAction(-SWIPE_THRESHOLD, SWIPE_THRESHOLD)).toBeNull()
    expect(swipeAction(SWIPE_THRESHOLD + 10, -(SWIPE_THRESHOLD + 20))).toBeNull()
  })
})
