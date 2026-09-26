import { describe, expect, test } from 'vitest'

import { ApiError } from './api'
import { chatErrorMessage, chatId, coachLines, sortChat, type CoachContext } from './chat'
import type { ChatMessage } from './db'
import type { CoachTip } from './coach'
import type { FoodSuggestion, SlotGap } from './nutrition'

const EMPTY: CoachContext = { tips: [], protein: null, gaps: [], foods: [], trend: null }

describe('coachLines', () => {
  test('hesaplanan sayilar metne birebir giriyor', () => {
    const text = coachLines({
      ...EMPTY,
      tips: [
        { kind: 'today', groups: ['göğüs', 'kol'], logged: false, severity: 'info' },
        { kind: 'progress_weight', muscle: 'göğüs', from_kg: 60, to_kg: 62, severity: 'info' },
      ],
      protein: { kind: 'protein_target', min_g: 130, max_g: 180, recommended_g: 150, current_goal_g: 140, delta_g: 10, severity: 'info' },
      gaps: [{ kind: 'slot_gap', slot: 'evening', consumed_g: 10, target_g: 40, gap_g: 30, upcoming: false, severity: 'warn' }],
      foods: [{ kind: 'food', slot: 'evening', food: 'tavuk göğsü', grams: 200, count: null, protein_g: 62, times: 4, source: 'history', severity: 'info' }],
      trend: { kind: 'weight_trend', actual_kg: 0.3, target_kg: 0.6, delta_kg: -0.3, status: 'too_slow', severity: 'warn' },
    }).join('\n')

    expect(text).toContain('bugünün odağı: göğüs, kol (henüz kayıt yok)')
    expect(text).toContain('göğüs: 60 kg → 62 kg')
    expect(text).toContain('~150 g/gün (aralık 130-180; ayardaki hedef 140 g)')
    expect(text).toContain('akşam 30 g eksik')
    expect(text).toContain('200 g tavuk göğsü ~62 g protein')
    expect(text).toContain('haftada 0.3 kg (hedef 0.6 kg) — hedefin altında')
  })

  test('oneri sayisi sinirli ve warn olanlar once giriyor', () => {
    const many: CoachTip[] = [
      { kind: 'progress_reps', muscle: 'a', reps: 10, to_reps: 11, severity: 'info' },
      { kind: 'progress_reps', muscle: 'b', reps: 10, to_reps: 11, severity: 'info' },
      { kind: 'progress_reps', muscle: 'c', reps: 10, to_reps: 11, severity: 'info' },
      { kind: 'progress_reps', muscle: 'd', reps: 10, to_reps: 11, severity: 'info' },
      { kind: 'stall', muscle: 'bacak', sessions: 3, severity: 'warn' },
    ]
    const line = coachLines({ ...EMPTY, tips: many })[0]!

    expect(line).toContain('bacak: 3 seanstır ilerleme yok')
    expect(line.split(' · ')).toHaveLength(4)
    expect(line).not.toContain('d: ')
  })

  test('yiyecek onerisi ucle sinirli, tohum kalemler isaretli', () => {
    const foods: FoodSuggestion[] = ['a', 'b', 'c', 'd'].map((food, i) => ({
      kind: 'food', slot: 'noon', food, grams: null, count: null, protein_g: 20, times: 0,
      source: i === 0 ? 'seed' : 'history', severity: 'info',
    }))
    const line = coachLines({ ...EMPTY, foods })[0]!

    expect(line).toContain('öğle için önerilebilecek yiyecekler')
    expect(line).toContain('a ~20 g protein (geçmişte yok)')
    expect(line).not.toContain('d ~')
  })

  test('veri yoksa hic satir uretmez - bos baglam sisirilmez', () => {
    expect(coachLines(EMPTY)).toEqual([])
  })

  test('koc blogu kompakt kalir', () => {
    const gaps: SlotGap[] = (['morning', 'noon', 'evening'] as const).map((slot) => ({
      kind: 'slot_gap', slot, consumed_g: 0, target_g: 40, gap_g: 40, upcoming: false, severity: 'warn',
    }))
    const text = coachLines({
      ...EMPTY,
      gaps,
      tips: [
        { kind: 'today', groups: ['göğüs', 'sırt', 'bacak'], logged: true, severity: 'info' },
        { kind: 'volume_none', muscle: 'omuz', severity: 'warn' },
        { kind: 'volume_high', muscle: 'bacak', sets: 24, cap: 20, severity: 'info' },
        { kind: 'stall', muscle: 'göğüs', sessions: 3, severity: 'warn' },
        { kind: 'deload', reason: 'buildup', weeks: 5, severity: 'warn' },
      ],
      protein: { kind: 'protein_target', min_g: 130, max_g: 180, recommended_g: 150, current_goal_g: 140, delta_g: 10, severity: 'info' },
      foods: [{ kind: 'food', slot: 'morning', food: 'yumurta beyazı', grams: 200, count: null, protein_g: 22, times: 9, source: 'history', severity: 'info' }],
      trend: { kind: 'weight_trend', actual_kg: 0.5, target_kg: 0.6, delta_kg: -0.1, status: 'on_track', severity: 'info' },
    }).join('\n')

    expect(text.length).toBeLessThan(500)
  })
})

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

describe('chat sirasi', () => {
  const msg = (id: string, role: 'user' | 'eva', date = '2026-09-26', at = '14:00'): ChatMessage =>
    ({ id, date, at, role, text: id, via: 'text' })

  test('yeni id zamana gore siralanir: soru cevabinin ustunde kalir', () => {
    const q = chatId(new Date(2026, 8, 26, 14, 0, 5, 1))
    const a = chatId(new Date(2026, 8, 26, 14, 0, 9, 2))
    const q2 = chatId(new Date(2026, 8, 26, 14, 1, 0, 0))
    expect(sortChat([msg(q2, 'user'), msg(a, 'eva'), msg(q, 'user')]).map((m) => m.id)).toEqual([q, a, q2])
  })

  test('eski rastgele id tarih+saatle siralanir, ayni dakikada soru once', () => {
    const out = sortChat([
      msg('f0000000-0000-4000-8000-000000000000', 'eva', '2026-09-25', '09:00'),
      msg('00000000-0000-4000-8000-000000000000', 'user', '2026-09-25', '09:00'),
      msg('10000000-0000-4000-8000-000000000000', 'user', '2026-09-24', '23:00'),
      msg(chatId(new Date(2026, 8, 26, 8, 0)), 'user'),
    ])
    expect(out.map((m) => m.date + m.role)).toEqual(['2026-09-24user', '2026-09-25user', '2026-09-25eva', '2026-09-26user'])
  })
})
