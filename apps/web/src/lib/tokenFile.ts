import { registerPlugin } from '@capacitor/core'

import { getToken, setToken } from './api'
import { isNative } from './health'

/**
 * Token's copy outside the WebView: /sdcard/evaitec/wellness-token.txt (TokenFilePlugin.kt).
 * Uninstall wipes localStorage; this file survives, so a fresh install picks the token
 * up without typing it. Needs "all files access"; without it every call is a no-op.
 */
const TokenFile = registerPlugin<{
  read(): Promise<{ access: boolean; token?: string }>
  write(options: { token: string }): Promise<{ ok: boolean }>
  requestAccess(): Promise<{ ok: boolean }>
}>('TokenFile')

/** Fills an empty token from the file. Returns whether file access is granted. */
export async function restoreToken(): Promise<boolean> {
  if (!isNative()) return true
  const { access, token } = await TokenFile.read().catch(() => ({ access: false, token: undefined }))
  if (token && !getToken()) setToken(token)
  // The file may predate the permission grant: keep it in step with the current token.
  if (access && !token && getToken()) await saveTokenFile(getToken())
  return access
}

export async function saveTokenFile(token: string): Promise<void> {
  if (!isNative() || !token) return
  await TokenFile.write({ token }).catch(() => undefined)
}

export async function requestTokenFileAccess(): Promise<void> {
  if (isNative()) await TokenFile.requestAccess()
}
