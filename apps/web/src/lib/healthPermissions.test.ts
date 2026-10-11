import { describe, expect, it } from 'vitest'

import { anyGranted } from './healthPermissions'

describe('anyGranted', () => {
  it('reads the object shape Android actually returns', () => {
    expect(anyGranted({ READ_STEPS: true, READ_WEIGHT: false })).toBe(true)
    expect(anyGranted({ READ_STEPS: false })).toBe(false)
  })

  it('reads the typed array shape', () => {
    expect(anyGranted([{ READ_STEPS: false }, { READ_WEIGHT: true }])).toBe(true)
    expect(anyGranted([{ READ_STEPS: false }])).toBe(false)
  })

  it('treats missing or odd values as not granted', () => {
    expect(anyGranted(undefined)).toBe(false)
    expect(anyGranted(null)).toBe(false)
    expect(anyGranted([])).toBe(false)
  })
})
