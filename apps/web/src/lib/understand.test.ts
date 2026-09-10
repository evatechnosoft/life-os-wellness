import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setToken } from './api'
import { understand } from './voice'

/** No DOM in this runner; api.ts and store.ts read the global at call time. */
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

function reply(body: unknown, status = 200): void {
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(body), { status })) as typeof fetch
}

describe('understand', () => {
  beforeEach(() => {
    store.clear()
    setToken('test-token')
  })

  it('returns the answer with no draft when there is nothing to record', async () => {
    reply({ text: 'Bugün kaç adım attın?', draft: null })
    const result = await understand('kaç adım sormadın')
    // Not null: the service answered. A null return would make the UI blame the token.
    expect(result).not.toBeNull()
    expect(result?.draft).toBeNull()
    expect(result?.text).toBe('Bugün kaç adım attın?')
  })

  it('returns a draft when the sentence carries a number', async () => {
    reply({ text: '', draft: { steps: 8500, summary: '8500 adım yüründü.' } })
    const result = await understand('bugün 8500 adım yürüdüm')
    expect(result?.draft?.steps).toBe(8500)
  })

  it('returns null only when the service is unreachable', async () => {
    reply({ error: 'no llm' }, 503)
    expect(await understand('merhaba')).toBeNull()
  })
})
