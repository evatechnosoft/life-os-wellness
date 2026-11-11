import { SystemBars, SystemBarsStyle } from '@capacitor/core'

// Palettes live in index.css under :root[data-theme=...]; this file only picks one.
export type ThemeId = 'kagit' | 'kagit-gece' | 'aurora'

export const THEME_OPTIONS = [
  { value: 'kagit', label: 'Kâğıt' },
  { value: 'kagit-gece', label: 'Gece' },
  { value: 'aurora', label: 'Aurora' },
] as const satisfies readonly { value: ThemeId; label: string }[]

const KEY = 'wellness.theme'
const DEFAULT: ThemeId = 'kagit'
// Browser/Android chrome around the page; must match --color-bg of each theme.
const CHROME: Record<ThemeId, { color: string; dark: boolean }> = {
  kagit: { color: '#F0EEE9', dark: false },
  'kagit-gece': { color: '#1A1714', dark: true },
  aurora: { color: '#0b0d12', dark: true },
}

export function parseTheme(raw: string | null): ThemeId {
  return THEME_OPTIONS.some((o) => o.value === raw) ? (raw as ThemeId) : DEFAULT
}

export const getTheme = (): ThemeId => parseTheme(localStorage.getItem(KEY))

export function applyTheme(theme: ThemeId = getTheme()): void {
  localStorage.setItem(KEY, theme)
  document.documentElement.dataset.theme = theme
  const { color, dark } = CHROME[theme]
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
  // Status bar icons must contrast with the page; no-op on the web.
  void SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(() => undefined)
}
