import { describe, expect, test } from 'vitest'

import { ApiError } from './api'
import { chatErrorMessage } from './chat'

describe('chatErrorMessage', () => {
  test('saglayici kotasi: bekle mesaji, ham metin sizmaz', () => {
    const msg = chatErrorMessage(new ApiError(429, 'Model şu an meşgul, birazdan tekrar dene'))
    expect(msg).toBe('Eva şu an yoğun, birkaç saniye sonra tekrar dene.')
  })

  test('kendi hiz limitimiz ayri bir mesaj alir', () => {
    expect(chatErrorMessage(new ApiError(429, 'too_many_requests'))).toMatch(/bir dakika bekle/)
  })

  test('baska her hata baglanti mesaji', () => {
    expect(chatErrorMessage(new ApiError(502, 'Yanıt alınamadı'))).toBe('Yanıt alamadım. Bağlantıyı kontrol et.')
    expect(chatErrorMessage(new TypeError('failed to fetch'))).toBe('Yanıt alamadım. Bağlantıyı kontrol et.')
  })
})
