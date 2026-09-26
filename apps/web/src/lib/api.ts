const TOKEN_KEY = 'wellness.api_token'
const BASE_KEY = 'wellness.api_base'

/** Giris alan adi: PWA'yi da API'yi de ayni konteyner servis eder. */
const SERVER = 'https://fit.evaitec.com'

/**
 * Where the API lives. Served from fit.evaitec.com the app is already on the API's
 * origin, so the base is empty and no request leaves the origin. Dev is the same shape:
 * Vite proxies /api to :3011. Only the callers that cannot be same-origin -- the APK's
 * webview, the Pages mirror -- need the full URL. Overridable for the home network.
 */
const DEFAULT_BASE =
  !import.meta.env.PROD || window.location.origin === SERVER ? '' : SERVER

export function getApiBase(): string {
  return localStorage.getItem(BASE_KEY) ?? DEFAULT_BASE
}

export function setApiBase(base: string): void {
  const trimmed = base.trim().replace(/\/$/, '')
  if (trimmed) localStorage.setItem(BASE_KEY, trimmed)
  else localStorage.removeItem(BASE_KEY)
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Elle yazilmis adres icin bekleme: olu LAN adresi TCP zaman asimina kadar asiliyordu. */
const OVERRIDE_TIMEOUT_MS = 5000

/**
 * Thin fetch wrapper. Callers must treat a rejection as "still offline", never as data loss.
 *
 * Elle yazilmis adrese (ev agi) ulasilamazsa varsayilana duser: sunucunun LAN adresi
 * degisince (192.168.1.185 -> 192.168.0.4) telefon kendini sunucusuz sanip eski
 * yerel veriyle kaldi. Sunucu cevap verdiyse (4xx/5xx) ikinci deneme yok.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBase()
  if (base === DEFAULT_BASE) return request<T>(base, path, init)
  try {
    return await request<T>(base, path, { ...init, signal: init.signal ?? AbortSignal.timeout(OVERRIDE_TIMEOUT_MS) })
  } catch (err) {
    if (err instanceof ApiError) throw err
    return request<T>(DEFAULT_BASE, path, init)
  }
}

async function request<T>(base: string, path: string, init: RequestInit): Promise<T> {
  const res = await fetch(base + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${getToken()}`,
      ...init.headers,
    },
  })
  if (!res.ok) {
    // Sunucu hatanin kendisini `error` alaninda soyluyor (kota mi bizim limit mi);
    // atarsak cagiran iki 429'u ayirt edemez.
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(res.status, body?.error ?? `${init.method ?? 'GET'} ${path} -> ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
