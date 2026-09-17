import { describe, expect, test } from 'vitest'

import type { CoachTip } from './coach'
import { coachLines, dietBreakText, foodText, gapText, recoveryText, tipText, todayText } from './coachText'
import type { FoodSuggestion, SlotGap } from './nutrition'

const food = (patch: Partial<FoodSuggestion> = {}): FoodSuggestion => ({
  kind: 'food',
  slot: 'noon',
  food: 'tavuk göğsü',
  grams: 200,
  count: null,
  protein_g: 62,
  times: 4,
  source: 'history',
  severity: 'info',
  ...patch,
})

const gap = (patch: Partial<SlotGap> = {}): SlotGap => ({
  kind: 'slot_gap',
  slot: 'noon',
  consumed_g: 0,
  target_g: 34,
  gap_g: 34,
  upcoming: false,
  severity: 'warn',
  ...patch,
})

describe('foodText', () => {
  test('gramajli porsiyon yazilir', () => {
    expect(foodText(food())).toBe('200 g tavuk göğsü (62 g protein)')
  })

  test('adetle olculen porsiyon gram diye yazilmaz', () => {
    expect(foodText(food({ food: 'yumurta beyazı', grams: null, count: 6, protein_g: 22 }))).toBe(
      '6 yumurta beyazı (22 g protein)',
    )
  })

  test('porsiyon bilinmiyorsa yalniz isim ve protein', () => {
    expect(foodText(food({ grams: null, count: null }))).toBe('tavuk göğsü (62 g protein)')
  })
})

describe('gapText', () => {
  test('gecmis slot acik kalan gram ile yazilir', () => {
    expect(gapText(gap({ gap_g: 62 }), [food()])).toBe(
      'öğle için 62 g protein açık: 200 g tavuk göğsü (62 g protein).',
    )
  })

  test('gelmemis slot plan dilinde yazilir', () => {
    expect(gapText(gap({ slot: 'evening', gap_g: 40, upcoming: true, severity: 'info' }), [])).toBe(
      'akşama 40 g protein planla.',
    )
  })

  test('en fazla iki yiyecek onerilir', () => {
    const text = gapText(gap(), [food(), food({ food: 'ton balığı' }), food({ food: 'mercimek' })])
    expect(text).toContain(' ya da ')
    expect(text).not.toContain('mercimek')
  })
})

describe('tipText', () => {
  const cases: [string, CoachTip, string][] = [
    [
      'volume_low',
      { kind: 'volume_low', muscle: 'sırt', sets: 8, target: 10, add: 2, severity: 'info' },
      'sırt: bu hafta 8 set, hedef 10 — 2 set daha ekleyebilirsin.',
    ],
    [
      'volume_high',
      { kind: 'volume_high', muscle: 'omuz', sets: 24, cap: 20, severity: 'info' },
      'omuz: bu hafta 24 set; 20 üstünde kazanç azalan verimle sürüyor — toparlanmanı izle.',
    ],
    [
      'volume_none',
      { kind: 'volume_none', muscle: 'bacak', severity: 'warn' },
      'bacak bu hafta programda var ama henüz kaydı yok.',
    ],
    [
      'progress_weight',
      { kind: 'progress_weight', muscle: 'göğüs', from_kg: 60, to_kg: 62.5, severity: 'info' },
      'göğüs: 60 kg ile set başına 12 tekrarı geçtin — 62,5 kg deneyebilirsin.',
    ],
    [
      'progress_reps',
      { kind: 'progress_reps', muscle: 'göğüs', reps: 10, to_reps: 11, severity: 'info' },
      'göğüs: aynı ağırlıkta set başına 10 tekrar yaptın — 11 tekrarı hedefleyebilirsin.',
    ],
    [
      'progress_sets',
      { kind: 'progress_sets', muscle: 'kol', sets: 6, target: 10, severity: 'info' },
      'kol: bu hafta 6 set, hedef 10 — set eklemek en kolay artış.',
    ],
    [
      'stall',
      { kind: 'stall', muscle: 'göğüs', sessions: 3, severity: 'warn' },
      'göğüs 3 seanstır aynı yerde — egzersiz değiştirmek ya da tekrar aralığını açmak işe yarayabilir.',
    ],
    [
      'no_data',
      { kind: 'no_data', muscle: 'sırt', severity: 'info' },
      'sırt için ağırlık ve tekrar kaydı yok — girmeye başlarsan ilerlemeyi ben takip ederim.',
    ],
    [
      'deload/buildup',
      { kind: 'deload', reason: 'buildup', weeks: 5, severity: 'warn' },
      '5 haftadır hacim kesintisiz artıyor — toparlanman zorlanıyorsa hafif bir hafta iyi gelebilir.',
    ],
    [
      'deload/decline',
      { kind: 'deload', reason: 'decline', weeks: 3, severity: 'warn' },
      '3 haftadır hacim düşüyor — hafif bir hafta sonrası genelde daha iyi başlıyor.',
    ],
    [
      'today',
      { kind: 'today', groups: ['göğüs', 'kol'], logged: false, severity: 'info' },
      'Bugün göğüs, kol',
    ],
  ]

  test.each(cases)('%s', (_name, tip, expected) => {
    expect(tipText(tip)).toBe(expected)
  })

  test('veri yoksa oneri uydurulmaz, yonlendirme yapilir', () => {
    expect(tipText({ kind: 'no_data', muscle: 'sırt', severity: 'info' })).toContain('girmeye başlarsan')
  })
})

describe('todayText', () => {
  test('kayit girildiyse belirtilir', () => {
    expect(todayText({ kind: 'today', groups: ['bacak'], logged: true, severity: 'info' })).toBe(
      'Bugün bacak · kayıt girildi',
    )
  })

  test('programsiz gun bos cumle vermez', () => {
    expect(todayText({ kind: 'today', groups: [], logged: false, severity: 'info' })).toBe(
      'Bugün programda bölge yok',
    )
  })
})

describe('coachLines', () => {
  const info: CoachTip = { kind: 'volume_low', muscle: 'sırt', sets: 8, target: 10, add: 2, severity: 'info' }
  const warn: CoachTip = { kind: 'stall', muscle: 'göğüs', sessions: 3, severity: 'warn' }

  test('uyari once gelir, bugun satiri listeye girmez', () => {
    const today: CoachTip = { kind: 'today', groups: [], logged: false, severity: 'info' }
    const lines = coachLines([info, warn, today], [])
    expect(lines.map((l) => l.id)).toEqual(['stall:göğüs', 'volume_low:sırt'])
  })

  test('beslenme acigi antrenman onerisinin onune gecer', () => {
    const lines = coachLines([info], [{ gap: gap({ severity: 'info', upcoming: true }), foods: [food()] }])
    expect(lines[0]!.id).toBe('slot:noon')
  })

  test('ayni veri-yok cumlesi her kas icin tekrarlanmaz', () => {
    const lines = coachLines(
      [
        { kind: 'no_data', muscle: 'sırt', severity: 'info' },
        { kind: 'no_data', muscle: 'kol', severity: 'info' },
      ],
      [],
    )
    expect(lines).toHaveLength(1)
  })
})

describe('recoveryText', () => {
  const plan = {
    kind: 'recovery' as const,
    triggers: ['flag' as const],
    week_status: 'on_track' as const,
    applies_to: 'today' as const,
    protein_g: 176,
    steps_add: 1200,
    fiber_servings: 5,
    no_skip_meals: true as const,
    next_weigh_in: 'skip_tomorrow' as const,
    refer_support: false,
    severity: 'info' as const,
  }

  test('kisitlama dili hicbir bicimde gecmez', () => {
    for (const variant of [plan, { ...plan, applies_to: 'tomorrow' as const }, { ...plan, week_status: 'reset' as const }]) {
      const text = recoveryText(variant)
      for (const banned of ['az ye', 'oruç', 'ceza', 'telafi et']) {
        expect(text.toLowerCase()).not.toContain(banned)
      }
      // "atlama" serbest, "atla" emri yasak: olumsuzlugu ayirmadan arama yanilir.
      expect(text.toLowerCase()).not.toMatch(/atla(?!ma)/)
    }
  })

  test('ne EKLENECEGINI soyler ve tartiyi bekletir', () => {
    const text = recoveryText(plan)
    expect(text).toContain('176 g protein')
    expect(text).toContain('5 porsiyon sebze')
    expect(text).toContain('1.200 adım')
    expect(text).toContain('Öğün atlama')
    expect(text).toContain('tartı')
  })

  test('adim bilinmiyorsa adim cumlesi hic kurulmaz', () => {
    expect(recoveryText({ ...plan, steps_add: 0 })).not.toContain('adım')
  })

  test('gun bitmisse plan yarina yazilir', () => {
    expect(recoveryText({ ...plan, applies_to: 'tomorrow' })).toContain('Yarın')
  })

  test('uzman onerisi yumusak ve yalniz istendiginde', () => {
    expect(recoveryText(plan)).not.toContain('uzman')
    expect(recoveryText({ ...plan, refer_support: true })).toContain('uzmanla konuşmak')
  })
})

describe('dietBreakText', () => {
  const suggestion = {
    kind: 'diet_break' as const,
    weeks_in_deficit: 9,
    days: 14 as const,
    action: 'suggest_maintenance' as const,
    waist_known: true,
    severity: 'info' as const,
  }

  test('arac oldugunu soyler, metabolizma vaadi vermez', () => {
    const text = dietBreakText(suggestion)
    expect(text).toContain('mucize değil')
    expect(text.toLowerCase()).not.toContain('metabolizma')
    expect(text).toContain('9 hafta')
    expect(text).toContain('14 gün')
  })

  test('bel olculmemisse bel cumlesi kurulmaz', () => {
    expect(dietBreakText({ ...suggestion, waist_known: false })).not.toContain('bel')
  })
})
