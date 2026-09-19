import { describe, expect, it } from 'vitest'

import {
  EMPTY_PROFILE,
  age,
  isProfileEmpty,
  missingFields,
  profileLines,
  proteinRange,
  type Profile,
} from './profile'

const DEAN: Profile = {
  ...EMPTY_PROFILE,
  birth_year: 1985,
  height_cm: 178,
  sex: 'male',
  goal: 'cut',
  target_weight_kg: 92,
  training_years: 3,
  conditions: ['prediyabet'],
  medications: ['metformin'],
  injuries: ['sol omuz sıkışma'],
  dislikes: ['balık'],
  allergies: [],
  cuisine: 'Türk ev yemeği',
  equipment: ['dumbbell', 'machine'],
  days_per_week: 3,
  session_min: 45,
}

describe('age', () => {
  it('dogum yilindan yasi cikarir', () => {
    expect(age(DEAN, new Date(2026, 8, 19))).toBe(41)
  })
  it('dogum yili yoksa null', () => {
    expect(age(EMPTY_PROFILE, new Date(2026, 8, 19))).toBeNull()
  })
})

describe('proteinRange', () => {
  it('kilodan 1.6-2.2 g/kg araligi uretir', () => {
    const r = proteinRange(109, 'cut')
    expect(r).toEqual({ min: 174, max: 240, start: 218 })
  })
  it('hedefe gore baslangic degisir: kesimde ust uca, almada alt uca yakin', () => {
    expect(proteinRange(109, 'gain')!.start).toBeLessThan(proteinRange(109, 'cut')!.start)
    expect(proteinRange(109, 'maintain')!.start).toBe(196)
  })
  it('kilo yoksa aralik yok - uydurma sayi uretilmez', () => {
    expect(proteinRange(null, 'cut')).toBeNull()
  })
})

describe('isProfileEmpty', () => {
  it('hicbir alan girilmemisse bos', () => {
    expect(isProfileEmpty(EMPTY_PROFILE)).toBe(true)
  })
  it('tek alan bile girilmisse bos degil', () => {
    expect(isProfileEmpty({ ...EMPTY_PROFILE, height_cm: 178 })).toBe(false)
    expect(isProfileEmpty({ ...EMPTY_PROFILE, conditions: ['prediyabet'] })).toBe(false)
  })
})

describe('missingFields', () => {
  it('bos profilde cekirdek alanlarin hepsini ister', () => {
    expect(missingFields(EMPTY_PROFILE)).toContain('boy')
    expect(missingFields(EMPTY_PROFILE)).toContain('doğum yılı')
  })
  it('dolu profilde bos doner', () => {
    expect(missingFields(DEAN)).toEqual([])
  })
  it('bos liste eksik sayilmaz: alerjisi olmayan biri eksik profil degildir', () => {
    expect(missingFields({ ...DEAN, allergies: [], dislikes: [] })).toEqual([])
  })
})

describe('profileLines', () => {
  it('tani ve ilaci ayri satirda yazar - persona kirmizi bayragi bunu okur', () => {
    const lines = profileLines(DEAN, 109, new Date(2026, 8, 19))
    expect(lines.join('\n')).toContain('tanı: prediyabet')
    expect(lines.join('\n')).toContain('ilaç: metformin')
  })

  it('yas, boy, hedef ve ekipmani tek profil satirinda toplar', () => {
    const line = profileLines(DEAN, 109, new Date(2026, 8, 19))[0]!
    expect(line).toContain('41 yaş')
    expect(line).toContain('178 cm')
    expect(line).toContain('hedef 92 kg')
    expect(line).toContain('haftada 3 gün')
  })

  it('protein araligini kilodan turetir', () => {
    expect(profileLines(DEAN, 109, new Date(2026, 8, 19)).join('\n')).toContain('174-240 g')
  })

  it('profil bossa tek satir: eksik oldugunu soyler, sayi uretmez', () => {
    const lines = profileLines(EMPTY_PROFILE, 109, new Date(2026, 8, 19))
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('profil girilmemiş')
    expect(lines.join('\n')).not.toMatch(/\d+-\d+ g/)
  })

  it('girilmemis alani uydurmaz: yalniz dolu alanlar satira girer', () => {
    const partial: Profile = { ...EMPTY_PROFILE, height_cm: 178, conditions: ['astım'] }
    const text = profileLines(partial, null, new Date(2026, 8, 19)).join('\n')
    expect(text).toContain('178 cm')
    expect(text).toContain('tanı: astım')
    expect(text).not.toContain('yaş')
    expect(text).not.toContain('protein')
  })
})
