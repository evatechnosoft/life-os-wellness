import { describe, expect, test } from 'vitest'

import { PULL_MAX, PULL_THRESHOLD, pullFrom, pullLabel } from './pull'

describe('pullFrom', () => {
  test('dokunulmuyorsa hareket yok', () => {
    expect(pullFrom(null, 300, 0)).toEqual({ distance: 0, armed: false, active: false })
  })

  test('sayfa tepede degilse cekme sayilmaz - yukari kaydirma yenileme degildir', () => {
    expect(pullFrom(100, 400, 250).active).toBe(false)
  })

  test('yukari dogru hareket gostergeyi acmaz', () => {
    expect(pullFrom(300, 200, 0).active).toBe(false)
  })

  test('asagi cekmede gosterge parmagin yarisi kadar iner', () => {
    expect(pullFrom(100, 200, 0).distance).toBe(50)
  })

  test('esik gecilince birakmaya hazir olur', () => {
    expect(pullFrom(100, 100 + PULL_THRESHOLD * 2 - 1, 0).armed).toBe(false)
    expect(pullFrom(100, 100 + PULL_THRESHOLD * 2, 0).armed).toBe(true)
  })

  test('mesafe tavani asmaz - sayfa lastik gibi durur', () => {
    expect(pullFrom(0, 2000, 0).distance).toBe(PULL_MAX)
  })
})

describe('pullLabel', () => {
  test('uc durum uc cumle', () => {
    const idle = pullFrom(100, 120, 0)
    const armed = pullFrom(100, 400, 0)
    expect(pullLabel(idle, false)).toBe('Yenilemek için çek')
    expect(pullLabel(armed, false)).toBe('Bırak, yenilensin')
    expect(pullLabel(armed, true)).toBe('Yenileniyor…')
  })
})
