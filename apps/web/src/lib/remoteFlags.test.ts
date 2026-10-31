import { beforeEach, describe, expect, test } from 'vitest'

import { applyRemoteFlags, featureOn } from './remoteFlags'

describe('remoteFlags', () => {
  beforeEach(() => applyRemoteFlags({}))

  test('varsayilan: hepsi acik', () => {
    expect(featureOn('cloud_ai')).toBe(true)
    expect(featureOn('local_llm')).toBe(true)
    expect(featureOn('web_bundle')).toBe(true)
  })

  test('false kapatir (buyuk/kucuk harf, bosluk), yalniz o ozelligi', () => {
    applyRemoteFlags({ feature_cloud_ai: ' False ' })
    expect(featureOn('cloud_ai')).toBe(false)
    expect(featureOn('local_llm')).toBe(true)
  })

  test('true, bos ve cop deger ozelligi kapatmaz; yeni uygulama onceki kapatmayi geri alir', () => {
    applyRemoteFlags({ feature_local_llm: 'false' })
    applyRemoteFlags({ feature_local_llm: 'true', feature_cloud_ai: '', feature_web_bundle: 'abc' })
    expect(featureOn('local_llm')).toBe(true)
    expect(featureOn('cloud_ai')).toBe(true)
    expect(featureOn('web_bundle')).toBe(true)
  })
})
