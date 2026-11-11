import { describe, expect, it } from 'vitest'

import { parseTheme } from './theme'

describe('parseTheme', () => {
  it('keeps a known theme', () => {
    expect(parseTheme('kagit-gece')).toBe('kagit-gece')
    expect(parseTheme('aurora')).toBe('aurora')
  })
  it('falls back to Kâğıt for missing or unknown values', () => {
    expect(parseTheme(null)).toBe('kagit')
    expect(parseTheme('neon')).toBe('kagit')
  })
})
