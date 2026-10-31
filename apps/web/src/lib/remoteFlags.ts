import { firebaseApp } from './firebaseApp'

/**
 * Firebase Remote Config kill-switch'leri. Parametre adi `feature_<key>`; varsayilan acik
 * (davranis degismez), uzaktan deger yalniz KAPATIR. Acilista onbellek uygulanir, yeni
 * deger arka planda indirilir ve sonraki acilista gecerli olur. Firebase kurulamazsa
 * ya da ag yoksa sessizce atlanir: uygulama asla bunun yuzunden beklemez.
 */
export type FeatureKey = 'cloud_ai' | 'local_llm' | 'web_bundle'

const KEYS: readonly FeatureKey[] = ['cloud_ai', 'local_llm', 'web_bundle']
const off = new Set<FeatureKey>()

export const featureOn = (key: FeatureKey): boolean => !off.has(key)

/** Uzak degerleri uygular; yalniz acik "false" kapatir, bos/bilinmeyen deger varsayilani korur. */
export function applyRemoteFlags(values: Record<string, string | undefined>): void {
  off.clear()
  for (const key of KEYS) if (values[`feature_${key}`]?.trim().toLowerCase() === 'false') off.add(key)
}

export async function initRemoteFlags(): Promise<void> {
  try {
    const { getRemoteConfig, activate, fetchConfig, getAll } = await import('firebase/remote-config')
    const rc = getRemoteConfig(firebaseApp())
    rc.settings.minimumFetchIntervalMillis = 12 * 60 * 60 * 1000
    rc.settings.fetchTimeoutMillis = 10_000
    rc.defaultConfig = Object.fromEntries(KEYS.map((k) => [`feature_${k}`, 'true']))
    await activate(rc)
    applyRemoteFlags(Object.fromEntries(Object.entries(getAll(rc)).map(([k, v]) => [k, v.asString()])))
    void fetchConfig(rc).catch(() => {})
  } catch {
    // shortcut: tum hatalar yutulur (kill-switch best-effort); sorun olursa uyari logu ekle.
  }
}
