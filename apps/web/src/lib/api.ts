const TOKEN_KEY = 'wellness.api_token'

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
  const res = await fetch(path, {
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
