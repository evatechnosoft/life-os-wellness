import { beforeEach, describe, expect, it } from 'vitest'

import { api, ApiError, getApiBase } from './api'

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

describe('tek sunucu adresi', () => {
  beforeEach(() => localStorage.clear())

  it('build varsayilanini kullanir', () => {
    // Tests run as a dev build, where the Vite proxy makes a relative path right.
    expect(getApiBase()).toBe('')
  })

  it('telefonda kalmis eski elle adres okunmaz (2 Eki: olu LAN adresi Eva\'yi bekletiyordu)', async () => {
    localStorage.setItem('wellness.api_base', 'http://192.168.1.185:3011')
    const urls: string[] = []
    globalThis.fetch = (async (url: string) => {
      urls.push(url)
      return new Response('{"ok":true}', { status: 200 })
    }) as typeof fetch
    await expect(api<{ ok: boolean }>('/api/goals')).resolves.toEqual({ ok: true })
    expect(urls).toEqual(['/api/goals'])
  })

  it('sunucu hatasi ApiError olarak doner', async () => {
    globalThis.fetch = (async () => new Response('{"error":"nope"}', { status: 400 })) as typeof fetch
    await expect(api('/api/goals')).rejects.toBeInstanceOf(ApiError)
  })
})
