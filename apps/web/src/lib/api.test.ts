import { beforeEach, describe, expect, it } from 'vitest'

import { getApiBase, setApiBase } from './api'

/** No DOM in this runner, and api.ts reads the global at call time, so a map is enough. */
const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size
  },
} as Storage

describe('api base', () => {
  beforeEach(() => localStorage.clear())

  it('falls back to the build default when nothing is stored', () => {
    // Tests run as a dev build, where the Vite proxy makes a relative path right.
    expect(getApiBase()).toBe('')
  })

  it('keeps an override and strips its trailing slash', () => {
    setApiBase('http://192.168.1.185:3011/')
    expect(getApiBase()).toBe('http://192.168.1.185:3011')
  })

  it('clears the override when emptied, rather than storing an empty prefix', () => {
    setApiBase('https://fit.evaitec.com')
    setApiBase('   ')
    expect(localStorage.getItem('wellness.api_base')).toBe(null)
  })
})
