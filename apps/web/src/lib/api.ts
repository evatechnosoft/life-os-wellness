const TOKEN_KEY = 'wellness.api_token'

/** Giris alan adi: PWA'yi da API'yi de ayni konteyner servis eder. */
const SERVER = 'https://fit.evaitec.com'

/**
 * Where the API lives. Served from fit.evaitec.com the app is already on the API's
 * origin, so the base is empty and no request leaves the origin. Dev is the same shape:
 * Vite proxies /api to :3011. Only the callers that cannot be same-origin -- the APK's
 * webview, the Pages mirror -- need the full URL. Tek adres: elle sunucu adresi (ev agi)
 * 2 Eki'de kaldirildi - eski LAN adresi telefonda kalip Eva'yi ve senkronu bekletiyordu.
 */
const DEFAULT_BASE =
  !import.meta.env.PROD || window.location.origin === SERVER ? '' : SERVER

export function getApiBase(): string {
  return DEFAULT_BASE
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

/** Thin fetch wrapper. Callers must treat a rejection as "still offline", never as data loss. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(DEFAULT_BASE, path, init)
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
