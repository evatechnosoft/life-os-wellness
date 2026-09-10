const TOKEN_KEY = 'wellness.api_token'
const BASE_KEY = 'wellness.api_base'

/**
 * Where the API lives. Dev serves the app from Vite, which proxies /api to :3011, so an
 * empty base is right there. A built app (Pages or the APK) is served from somewhere the
 * API is not, so it needs the full origin. Overridable for a phone on the home network.
 */
const DEFAULT_BASE = import.meta.env.PROD ? 'https://fit.evaitec.com' : ''

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

/** Thin fetch wrapper. Callers must treat a rejection as "still offline", never as data loss. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(getApiBase() + path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${getToken()}`,
      ...init.headers,
    },
  })
  if (!res.ok) throw new ApiError(res.status, `${init.method ?? 'GET'} ${path} -> ${res.status}`)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
