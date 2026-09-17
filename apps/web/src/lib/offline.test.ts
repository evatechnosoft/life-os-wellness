import { describe, expect, test } from 'vitest'

import type { CoachContext } from './chat'
import { OFFLINE_NOTE, offlineReply, parseDraft } from './offline'

const EMPTY: CoachContext = { tips: [], protein: null, gaps: [], foods: [], trend: null }

const FULL: CoachContext = {
  tips: [
    { kind: 'today', groups: ['göğüs', 'kol'], logged: false, severity: 'info' },
    { kind: 'progress_weight', muscle: 'göğüs', from_kg: 60, to_kg: 62, severity: 'info' },
    { kind: 'stall', muscle: 'bacak', sessions: 3, severity: 'warn' },
  ],
  protein: { kind: 'protein_target', min_g: 130, max_g: 180, recommended_g: 150, current_goal_g: 140, delta_g: 10, severity: 'info' },
  gaps: [{ kind: 'slot_gap', slot: 'evening', consumed_g: 10, target_g: 40, gap_g: 30, upcoming: false, severity: 'warn' }],
  foods: [{ kind: 'food', slot: 'evening', food: 'tavuk göğsü', grams: 200, count: null, protein_g: 62, times: 4, source: 'history', severity: 'info' }],
  trend: { kind: 'weight_trend', actual_kg: 0.3, target_kg: 0.6, delta_kg: -0.3, status: 'too_slow', severity: 'warn' },
}

describe('parseDraft', () => {
  test('tarti kilosu ust alana, kaldirilan agirlik antrenmana', () => {
    expect(parseDraft('bugün 84,3 kilo')).toMatchObject({ weight_kg: 84.3 })
    const w = parseDraft('bench 60 kg 3 set 10 tekrar')!
    expect(w.weight_kg).toBeUndefined()
    expect(w.workout).toMatchObject({ type: 'resistance', weight_kg: 60, sets_total: 3, reps_total: 30, muscle_groups: ['göğüs'] })
  })

  test('5x5, sure ve kardiyo', () => {
    expect(parseDraft('80 kg squat 5x5')!.workout).toMatchObject({ sets_total: 5, reps_total: 25, weight_kg: 80 })
    expect(parseDraft('yarım saat yürüdüm 30 dk')!.workout).toMatchObject({ type: 'walk', duration_min: 30, weight_kg: null })
  })

  test('protein, adim, tansiyon', () => {
    expect(parseDraft('40 g protein aldım 8000 adım 120/80')).toMatchObject({ protein_g: 40, steps: 8000, bp_systolic: 120, bp_diastolic: 80 })
  })

  test('sik yenen yiyecek gecmis degerle dolar, bilinmeyen sadece not', () => {
    const known = [{ name: 'tavuk göğsü', protein_g: 62, kcal: 330, times: 4 }]
    expect(parseDraft('öğlen tavuk göğsü yedim', known)).toMatchObject({ protein_g: 62, kcal: 330, meal_note: 'öğlen tavuk göğsü yedim' })
    const unknown = parseDraft('mercimek çorbası içtim', known)!
    expect(unknown.protein_g).toBeUndefined()
    expect(unknown.meal_note).toBe('mercimek çorbası içtim')
  })

  test('sayi yoksa taslak yok', () => {
    expect(parseDraft('bugün nasılım?')).toBeNull()
  })
})

describe('offlineReply', () => {
  test('taslak varsa onay ister, cevrimdisi notu basta', () => {
    const r = offlineReply('84 kg', FULL)
    expect(r.text.startsWith(OFFLINE_NOTE)).toBe(true)
    expect(r.text).toContain('Onaylarsan')
    expect(r.draft).toMatchObject({ weight_kg: 84 })
  })

  test('protein sorusu hesaplanmis hedef ve acik ogunle yanitlanir', () => {
    const r = offlineReply('bugün ne kadar protein almalıyım?', FULL)
    expect(r.text).toContain('~150 g/gün')
    expect(r.text).toContain('akşam için 30 g protein açık')
    expect(r.text).toContain('tavuk göğsü')
    expect(r.draft).toBeNull()
  })

  test('antrenman sorusu bugunun odagi + oneriler', () => {
    const r = offlineReply('bugün antrenmanda ne yapayım?', FULL)
    expect(r.text).toContain('Bugün göğüs, kol')
    expect(r.text).toContain('62 kg')
  })

  test('kilo sorusu 7 gun ortalamasiyla', () => {
    expect(offlineReply('kilo veriyor muyum?', FULL).text).toContain('haftada 0,3 kg')
    expect(offlineReply('kilo veriyor muyum?', EMPTY).text).toContain('iki haftalık')
  })

  test('veri yokken rakam uydurmaz', () => {
    const r = offlineReply('yarın squat kaç kilo?', EMPTY)
    expect(r.text).toContain('hesaplanmış bir antrenman önerisi yok')
    expect(r.text).not.toMatch(/\d+ kg/)
  })

  test('kirmizi bayrak: plan yok, hekim', () => {
    const r = offlineReply('bench yaparken göğsümde baskı oldu, yarın bacak yapayım mı?', FULL)
    expect(r.text).toContain('hekime')
    expect(r.draft).toBeNull()
  })
})

describe('abarttim isareti', () => {
  test('kullanicinin kendi ifadesi gunu isaretler', () => {
    for (const said of ['dün abarttım', 'akşam kaçırdım', 'düğün vardı, çok yedim']) {
      expect(parseDraft(said)?.overate).toBe(true)
    }
  })

  test('siradan ogun cumlesi isaret uretmez', () => {
    expect(parseDraft('akşam 200 g tavuk yedim')?.overate).toBeUndefined()
  })

  test('isaret ozetle birlikte gorunur ve kisitlama uretmez', () => {
    const draft = parseDraft('bugün abarttım')
    expect(draft?.summary).toContain('abarttım')
    expect(draft?.protein_g).toBeUndefined()
  })
})
