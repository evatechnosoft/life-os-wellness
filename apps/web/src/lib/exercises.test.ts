import { describe, expect, test } from 'vitest'

import { alternatives, byEquipment, byMuscle, EXERCISES, find, regionsFor, roleOf, search } from './exercises'

describe('kutuphane', () => {
  test('her hareketin Turkce adi ve iki karesi var', () => {
    expect(EXERCISES.length).toBeGreaterThan(0)
    for (const e of EXERCISES) {
      expect(e.name).not.toBe('')
      expect(e.media.length).toBeGreaterThanOrEqual(2)
      expect(e.media[0]!.url).toMatch(/^https:\/\//)
    }
  })

  test('find bilinmeyen id icin null doner, uydurmaz', () => {
    expect(find('Yok_Boyle_Bir_Hareket')).toBeNull()
    expect(find('Plank')?.name).toBe('Plank')
  })
})

describe('byEquipment', () => {
  test('yalniz istenen ekipmani doner', () => {
    const machines = byEquipment('machine')
    expect(machines.length).toBeGreaterThan(0)
    expect(machines.every((e) => e.equipment === 'machine')).toBe(true)
  })

  test('salonu olmayan biri icin dambil listesinde barbell cikmaz', () => {
    expect(byEquipment('dumbbell').some((e) => e.equipment === 'barbell')).toBe(false)
  })
})

describe('byMuscle', () => {
  test('birincil kasa gore filtreler', () => {
    const abs = byMuscle('abdominals')
    expect(abs.map((e) => e.id)).toContain('Plank')
    expect(abs.every((e) => e.primary.includes('abdominals'))).toBe(true)
  })

  test('ikincil kas varsayilan olarak sayilmaz', () => {
    // Ikincil de istenirse acikca istenir; yoksa "gogus" listesi yarim gogus
    // hareketleriyle dolar ve haftalik set sayimi sisirir.
    const primaryOnly = byMuscle('glutes')
    const withSecondary = byMuscle('glutes', { includeSecondary: true })
    expect(withSecondary.length).toBeGreaterThanOrEqual(primaryOnly.length)
  })
})

describe('alternatives', () => {
  test('ayni kasi calistiran baska hareketleri doner, kendini dondurmez', () => {
    const alts = alternatives('Leg_Press')
    expect(alts.map((e) => e.id)).not.toContain('Leg_Press')
    expect(alts.every((e) => e.primary.some((m) => find('Leg_Press')!.primary.includes(m)))).toBe(true)
  })

  test('ekipman kisitiyla daralir - "makinem yok, dambilla ne yaparim"', () => {
    const alts = alternatives('Barbell_Hip_Thrust', { equipment: ['machine', 'dumbbell'] })
    expect(alts.every((e) => ['machine', 'dumbbell'].includes(e.equipment))).toBe(true)
  })

  test('bilinmeyen id icin bos liste, hata degil', () => {
    expect(alternatives('Yok')).toEqual([])
  })
})

describe('regionsFor', () => {
  test('kas adlarini vucut haritasi bolgelerine cevirir', () => {
    const r = regionsFor(find('Plank')!)
    expect(r.primary).toContain('karin')
    expect(r.load).toContain('bel')
  })

  test('ayni bolge hem destek hem yuk noktasi olabilir', () => {
    // Pallof'ta omuz: ikincil kas ama ayni zamanda korunacak nokta.
    const r = regionsFor(find('Pallof_Press')!)
    expect(r.support).toContain('omuz')
    expect(r.load).toContain('omuz')
  })

  test('taninmayan kas adi sessizce dusmez, oldugu gibi gecer', () => {
    const r = regionsFor({ ...find('Plank')!, primary: ['uydurma_kas'] })
    expect(r.primary).toContain('uydurma_kas')
  })
})

describe('search', () => {
  test('Turkce ve Ingilizce ada gore bulur', () => {
    expect(search('yan kaldır').map((e) => e.id)).toContain('Side_Lateral_Raise')
    expect(search('lateral').map((e) => e.id)).toContain('Side_Lateral_Raise')
  })

  test('buyuk-kucuk harf ve Turkce karakter farki aramayi bozmaz', () => {
    expect(search('PLANK').map((e) => e.id)).toContain('Plank')
    expect(search('gobLet').map((e) => e.id)).toContain('Goblet_Squat')
  })

  test('bos sorgu tum listeyi doner', () => {
    expect(search('  ').length).toBe(EXERCISES.length)
  })
})

describe('roleOf', () => {
  test('birincil kas work, yuk noktasi load', () => {
    const r = regionsFor(find('Pallof_Press')!)
    expect(roleOf('karin', r)).toBe('work')
    expect(roleOf('bel', r)).toBe('load')
  })

  test('omuz hem destek hem yuk: destek kazanir, yuk ayri katmanda cizilir', () => {
    const r = regionsFor(find('Pallof_Press')!)
    expect(roleOf('omuz', r)).toBe('assist')
    expect(r.load).toContain('omuz')
  })

  test('rolu olmayan bolge null - vurgu cizilmez', () => {
    expect(roleOf('baldir', regionsFor(find('Plank')!))).toBeNull()
  })
})

describe('focus', () => {
  test('vurgu girilen harekette her kare icin ayri liste var', () => {
    const ex = find('Dead_Bug')!
    expect(ex.focus.length).toBe(ex.media.length)
    expect(ex.focus[0]!.some((s) => s.region === 'karin')).toBe(true)
  })

  test('vurgu girilmemis hareket bos dizi doner, uydurulmus koordinat yok', () => {
    expect(find('Plank')!.focus).toEqual([])
  })

  test('koordinatlar resmin icinde kaliyor', () => {
    for (const ex of EXERCISES) {
      for (const frame of ex.focus) {
        for (const s of frame) {
          expect(s.x).toBeGreaterThanOrEqual(0)
          expect(s.x).toBeLessThanOrEqual(100)
          expect(s.y).toBeGreaterThanOrEqual(0)
          expect(s.y).toBeLessThanOrEqual(100)
        }
      }
    }
  })
})
