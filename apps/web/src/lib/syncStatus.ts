/**
 * Baslikta tek rozet: sessizce kopan senkronu gorunur kilar.
 *
 * Health Connect 22 Eyl'de yazmayi birakti ve kimse fark etmedi - syncHealth her
 * asamada hatayi yutuyor. Nedeni degil sonucu olcuyoruz: saatten en son ne zaman
 * veri indi. Reddedilen outbox kaydi once gelir; o veri sunucuya hic ulasmadi.
 */
export interface SyncInput {
  /** Capacitor kabugu mu? PWA saat okuyamaz, orada saat uyarisi anlamsiz. */
  native: boolean
  /** health_connect kaynakli en yeni wearable satirinin synced_at'i. */
  lastWatchSync: string | null
  /** outbox_rejected listesindeki kayit sayisi. */
  rejected: number
  now: number
}

export interface SyncBadge {
  text: string
  tone: 'warn' | 'error'
}

const DAY_MS = 86_400_000

export function syncBadge({ native, lastWatchSync, rejected, now }: SyncInput): SyncBadge | null {
  if (rejected > 0) return { text: `${rejected} kayıt sunucuya yazılamadı`, tone: 'error' }
  if (!native) return null
  if (lastWatchSync === null) return { text: 'Saatten veri gelmedi', tone: 'warn' }
  const age = now - Date.parse(lastWatchSync)
  if (age <= DAY_MS) return null
  return { text: `Saat verisi ${Math.floor(age / DAY_MS)} gündür yok`, tone: 'warn' }
}
