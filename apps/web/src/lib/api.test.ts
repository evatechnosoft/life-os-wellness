import { beforeEach, describe, expect, it } from 'vitest'

import { api, ApiError, getApiBase, setApiBase } from './api'

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

describe('ulasilamayan elle adres', () => {
  beforeEach(() => localStorage.clear())

  it('ag hatasinda varsayilan adrese duser', async () => {
    setApiBase('http://192.168.1.185:3011')
    const urls: string[] = []
    globalThis.fetch = (async (url: string) => {
      urls.push(url)
      if (url.startsWith('http://192.168.1.185')) throw new TypeError('Failed to fetch')
      return new Response('{"ok":true}', { status: 200 })
    }) as typeof fetch
    await expect(api<{ ok: boolean }>('/api/goals')).resolves.toEqual({ ok: true })
    expect(urls).toEqual(['http://192.168.1.185:3011/api/goals', '/api/goals'])
  })

  it('sunucu cevap verdiyse (4xx) ikinci adrese gitmez', async () => {
    setApiBase('http://192.168.1.185:3011')
    let calls = 0
    globalThis.fetch = (async () => {
      calls++
      return new Response('{"error":"nope"}', { status: 400 })
    }) as typeof fetch
    await expect(api('/api/goals')).rejects.toBeInstanceOf(ApiError)
    expect(calls).toBe(1)
  })
})

describe('cagiranin suresi olan istek (Eva, 25 sn)', () => {
  beforeEach(() => localStorage.clear())

  it('olu elle adres cagiranin suresini yemez - 5 sn sonra varsayilana gecer (2 Eki: sunucu 200 dedi, telefon "Sunucu kapali")', async () => {
    setApiBase('http://192.168.1.185:3011')
    globalThis.fetch = ((url: string, init: RequestInit) =>
      new Promise((resolve, reject) => {
        const signal = init.signal!
        if (signal.aborted) return reject(signal.reason)
        // Gercek fetch gibi: iptal edilen sinyal istegi keser.
        signal.addEventListener('abort', () => reject(signal.reason))
        // LAN adresi hic cevap vermez (TCP zaman asimi); asil sunucu hemen cevaplar.
        if (!url.startsWith('http://192.168.1.185')) resolve(new Response('{"text":"ok"}', { status: 200 }))
      })) as typeof fetch
    await expect(api('/api/chat', { method: 'POST', signal: AbortSignal.timeout(8000) })).resolves.toEqual({ text: 'ok' })
  }, 10_000)
})
