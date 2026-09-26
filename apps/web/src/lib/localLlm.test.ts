import { describe, expect, test } from 'vitest'

import { gemmaPrompt, MAX_PROMPT_CHARS } from './localLlm'

describe('gemmaPrompt', () => {
  test('persona ve baglam ilk kullanici turune gomulur, model turu acik biter', () => {
    const p = gemmaPrompt('2026-09-14: 84 kg', [{ role: 'user', content: 'kaç kiloyum?' }])
    expect(p.startsWith('<start_of_turn>user\nSen Eva')).toBe(true)
    expect(p).toContain('Kullanıcının son günleri:\n2026-09-14: 84 kg')
    expect(p).toContain('\n\nkaç kiloyum?<end_of_turn>')
    expect(p.endsWith('<start_of_turn>model\n')).toBe(true)
  })

  test('gecmis kirpilir, asistan turu model olur, uzun baglam kesilir', () => {
    const turns = Array.from({ length: 7 }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `t${i}`,
    }))
    const p = gemmaPrompt('x'.repeat(5000), turns)
    expect(p).not.toContain('\nt0<')
    expect(p).toContain('<start_of_turn>model\nt5<end_of_turn>')
    expect(p).toContain('<start_of_turn>user\nt6<end_of_turn>')
    expect(p).toContain('x'.repeat(1200))
    expect(p).not.toContain('x'.repeat(1201))
  })

  test('kirpilmis gecmis asistanla basliyorsa persona ayri bir kullanici turu olur', () => {
    const p = gemmaPrompt('', [
      { role: 'user', content: 'a' }, { role: 'assistant', content: 'b' },
      { role: 'user', content: 'c' }, { role: 'assistant', content: 'd' },
      { role: 'user', content: 'e' },
    ])
    expect(p.indexOf('<start_of_turn>user\nSen Eva')).toBe(0)
    expect(p).toContain('<start_of_turn>model\nb<end_of_turn>')
  })

  test('istem 1280 tokenlik pencereye sigar: uzun baglam ve uzun gecmis kirpilir', () => {
    const long = 'ş'.repeat(3000)
    const p = gemmaPrompt(long, [
      { role: 'user', content: long }, { role: 'assistant', content: long },
      { role: 'user', content: long }, { role: 'assistant', content: long },
      { role: 'user', content: 'son soru' },
    ])
    expect(p.length).toBeLessThanOrEqual(MAX_PROMPT_CHARS)
    expect(p).toContain('son soru<end_of_turn>')
    expect(p.startsWith('<start_of_turn>user\nSen Eva')).toBe(true)
    expect(p.endsWith('<start_of_turn>model\n')).toBe(true)
  })

  test('son tur kullanici degilse hata', () => {
    expect(() => gemmaPrompt('', [{ role: 'assistant', content: 'x' }])).toThrow()
  })
})
