import { registerPlugin, WebView } from '@capacitor/core'

import { isNative } from './health'

/**
 * Live web update for the APK (GymPro Manager style, without changing origin).
 * fit.evaitec.com/bundle/ carries the native build of the same web app; the APK
 * downloads it into its files dir and Capacitor serves it from https://localhost,
 * so IndexedDB, the token and offline start all stay where they are. A new APK
 * resets to its own assets (Bridge.isNewBinary), so a stale bundle cannot outlive it.
 */
export interface BundleManifest {
  version: string
  /** versionCode of the APK this bundle was built against; older APKs lack its native plugins. */
  min_native: number
  files: string[]
}

const BASE = 'https://fit.evaitec.com/bundle/'

const WebBundle = registerPlugin<{
  info(): Promise<{ versionCode: number }>
  install(options: { base: string; version: string; files: string[] }): Promise<{ path: string }>
}>('WebBundle')

export function bundleAction(
  local: BundleManifest | null,
  remote: BundleManifest,
  versionCode: number,
): 'none' | 'install' | 'needs_apk' {
  if (local?.version === remote.version) return 'none'
  if (versionCode < remote.min_native) return 'needs_apk'
  return 'install'
}

/**
 * Downloads a newer bundle if there is one. The native side persists it, so the next
 * cold start opens it; the returned path lets the UI offer "reload now".
 */
export async function checkWebBundle(): Promise<string | null> {
  if (!isNative()) return null
  // Served from the running bundle (APK assets or a downloaded one); an APK built before
  // this feature has none, which reads as "unknown, take the server's".
  const local = await fetch('/bundle.json')
    .then((r) => (r.ok ? (r.json() as Promise<BundleManifest>) : null))
    .catch(() => null)
  const res = await fetch(`${BASE}bundle.json`, { cache: 'no-store' })
  if (!res.ok) return null
  const remote = (await res.json()) as BundleManifest
  const { versionCode } = await WebBundle.info()
  if (bundleAction(local, remote, versionCode) !== 'install') return null
  // bundle.json kendi listesinde yok (ops/web_bundle.mjs); indirilmezse yenilenen paket
  // surumunu bilemiyor, ayni paketi tekrar indirip "Yenile" seridi donguye giriyordu.
  const files = [...remote.files, 'bundle.json']
  const { path } = await WebBundle.install({ base: BASE, version: remote.version, files })
  return path
}

/** Reloads the webview from the downloaded bundle. Same origin: nothing stored is lost. */
export async function applyWebBundle(path: string): Promise<void> {
  await WebView.setServerBasePath({ path })
}
