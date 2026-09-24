import { describe, expect, it } from 'vitest'

import { syncBadge } from './syncStatus'

const NOW = Date.parse('2026-09-24T10:00:00Z')
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString()

describe('syncBadge', () => {
  it('her sey yolundaysa rozet yok', () => {
    expect(syncBadge({ native: true, lastWatchSync: hoursAgo(2), rejected: 0, now: NOW })).toBeNull()
  })

  it('saat verisi 24 saatten eskiyse uyarir', () => {
    expect(syncBadge({ native: true, lastWatchSync: hoursAgo(40), rejected: 0, now: NOW }))
      .toEqual({ text: 'Saat verisi 1 gündür yok', tone: 'warn' })
  })

  it('saatten hic veri gelmediyse soyler', () => {
    expect(syncBadge({ native: true, lastWatchSync: null, rejected: 0, now: NOW }))
      .toEqual({ text: 'Saatten veri gelmedi', tone: 'warn' })
  })

  it('PWA saat okuyamaz - orada saat uyarisi yok', () => {
    expect(syncBadge({ native: false, lastWatchSync: null, rejected: 0, now: NOW })).toBeNull()
  })

  it('reddedilen kayit saat uyarisindan once gelir - veri kaybi daha agir', () => {
    expect(syncBadge({ native: true, lastWatchSync: null, rejected: 2, now: NOW }))
      .toEqual({ text: '2 kayıt sunucuya yazılamadı', tone: 'error' })
  })
})
