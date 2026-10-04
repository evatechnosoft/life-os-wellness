import { useLiveQuery } from 'dexie-react-hooks'

import { api } from './api'
import { db } from './db'
import { hasServer, queueGoals } from './store'

export interface Goals {
  protein_g: number
  /**
   * Haftalik kayip hedefi, vucut agirliginin yuzdesi. Sabit kilogram yaniltir:
   * 0.6 kg 60 kiloda %1 (kanit araliginin sinirinda), 110 kiloda %0.55'tir.
   * Kanit araligi %0.5-1, orta nokta %0.7 (Helms 2014 · Garthe 2011).
   */
  weekly_loss_pct: number
  sets_per_group: number
  /**
   * Yuzdeye gecmeden once kg olarak kaydedilmis hedef. GOC YOLU: kayitliysa
   * efektif hedef budur - kullanicinin kendi kaydettigi sayi sessizce degismesin.
   * Kullanici ayari elle guncelledigi anda `saveGoals` bu alani siler ve yuzde
   * devralir. Yeni kayitlarda hic bulunmaz.
   */
  weekly_weight_loss_kg?: number
  /**
   * Oneri itme dozu (S2b). Bos birakilirsa ADAPTIF: telafi gunu `push`, diger
   * gunler `soft` (`lapse.ts > nudgeFor`). Elle secim adaptifi kapatir.
   */
  nudge?: 'soft' | 'push'
  /**
   * Haftalik serbest ogun gunu (0 = pazar, JavaScript getDay()). Planlidir,
   * kazanilmaz: o gun telafi plani cikmaz (PLAN-DIET S7). `useGoals` her zaman
   * doldurur; opsiyonel isaret yalniz eski kayitlar ve testler icin.
   */
  free_meal_day?: number
  /**
   * 7 gunluk ogun kcal ortalamasinin ust siniri. Gunluk hedef degil (AGENTS.md):
   * yalniz haftalik ortalama asinca uyari. 1900: 28 Eyl-4 Eki kayitlarinda 2191 kcal
   * ile -0.22 kg/hafta, acik ~500 kcal (PROGRAM: >500 yagsiz kutleyi siler). Dean, 4 Eki.
   */
  kcal_week_max?: number
}

export const DEFAULT_GOALS: Goals = {
  protein_g: 140,
  weekly_loss_pct: 0.7,
  sets_per_group: 10,
  // Cumartesi aksam (Dean, 2026-09-17).
  free_meal_day: 6,
  kcal_week_max: 1900,
}

export function useGoals(): Goals {
  const stored = useLiveQuery(() => db.settings.get('goals'), [])
  return { ...DEFAULT_GOALS, ...((stored?.value as Partial<Goals> | undefined) ?? {}) }
}

export async function saveGoals(goals: Goals): Promise<void> {
  // Kullanici hedefe dokundu: eski kg alani burada birakilir, yuzde devralir.
  const next: Goals = { ...goals }
  delete next.weekly_weight_loss_kg
  await db.settings.put({ key: 'goals', value: next })
  await queueGoals(next)
}

/** Sunucudaki hedefleri yerele alir; ajanin admin kanalindan yazdigi burada gorunur (pullProfile gibi). */
export async function pullGoals(): Promise<void> {
  if (!hasServer()) return
  const row = await api<Partial<Goals> | null>('/api/goals')
  if (!row) return
  await db.settings.put({ key: 'goals', value: { ...DEFAULT_GOALS, ...row } })
}
