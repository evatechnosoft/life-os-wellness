import { api } from './api'
import { db } from './db'
import { applyCatalog } from './exercises'
import { hasServer } from './store'

const KEY = 'exercise_catalog'
/** Acilis bunu beklediginden kisa tutuldu: gecikirse gomulu katalogla devam edilir. */
const TIMEOUT_MS = 3000

/**
 * Katalogu sunucudan tazeler (yeni hareket icin APK yayini gerekmesin).
 * Once onbellek uygulanir ki ag yokken de son surum gorunsun; hicbiri yoksa
 * derlemeye gomulu kopya yerinde kalir.
 */
export async function loadCatalog(): Promise<void> {
  const cached = await db.settings.get(KEY)
  if (cached) applyCatalog(cached.value)
  if (!hasServer()) return
  try {
    const fresh = await api<unknown>('/api/exercises', {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (applyCatalog(fresh)) await db.settings.put({ key: KEY, value: fresh })
  } catch {
    // Ag yok, zaman asimi ya da sunucuda katalog yok: onbellek/gomulu surum gecerli.
  }
}
