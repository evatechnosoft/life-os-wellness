import { describe, expect, test } from 'vitest'

import { bundleAction, type BundleManifest } from './webBundle'

const remote: BundleManifest = { version: 'b2', min_native: 3700, files: ['index.html'] }

describe('bundleAction', () => {
  test('ayni surum indirilmez', () => {
    expect(bundleAction({ ...remote }, remote, 3700)).toBe('none')
  })

  test('yeni surum kurulur', () => {
    expect(bundleAction({ ...remote, version: 'a1' }, remote, 3700)).toBe('install')
  })

  // Eski APK'da olmayan bir yerel eklentiyi cagiran ekran acilmasin: once APK.
  test('APK eskiyse paket beklenir', () => {
    expect(bundleAction({ ...remote, version: 'a1' }, remote, 3600)).toBe('needs_apk')
  })

  test('yerel manifest yoksa (eski APK) kurulur', () => {
    expect(bundleAction(null, remote, 3700)).toBe('install')
  })
})
