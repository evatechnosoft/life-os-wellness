/**
 * Profil: Eva'nin kullaniciyi tanimasi (PLAN-COACH S1). Hesaplama kismi saf
 * (profil -> turetilmis hedef ve baglam satiri); altta split.ts ile ayni desende
 * ince bir depo katmani var - Dexie tek kaynak, sunucuya outbox ile gider.
 *
 * Kural: girilmemis alan UYDURULMAZ. Eksik alan satira hic girmez, boylece model
 * "bilmiyorum, sunu soyle" diyebilir; yanlis sayiyi ezberden vermez.
 */
import { useLiveQuery } from 'dexie-react-hooks'

import { api } from './api'
import { db } from './db'
import { hasServer, queueProfile } from './store'

export type Sex = 'male' | 'female'
export type Goal = 'cut' | 'maintain' | 'gain'

/** PLAN-COACH S1 tablosu; sunucudaki `profile` satiriyla alan alan ayni. */
export interface Profile {
  birth_year: number | null
  height_cm: number | null
  sex: Sex | null
  goal: Goal | null
  target_weight_kg: number | null
  training_years: number | null
  /** COACH-PERSONA S2 kirmizi bayraklari bu ucunu okur. */
  conditions: string[]
  medications: string[]
  injuries: string[]
  dislikes: string[]
  allergies: string[]
  cuisine: string | null
  /** S2 hareket filtresi: gym/dumbbell/barbell/machine/bodyweight/cable/band. */
  equipment: string[]
  days_per_week: number | null
  session_min: number | null
}

export const EMPTY_PROFILE: Profile = {
  birth_year: null,
  height_cm: null,
  sex: null,
  goal: null,
  target_weight_kg: null,
  training_years: null,
  conditions: [],
  medications: [],
  injuries: [],
  dislikes: [],
  allergies: [],
  cuisine: null,
  equipment: [],
  days_per_week: null,
  session_min: null,
}

const SEX_TR: Record<Sex, string> = { male: 'erkek', female: 'kadın' }
const GOAL_TR: Record<Goal, string> = { cut: 'kesim', maintain: 'koruma', gain: 'alma' }

/** Gun/ay saklanmiyor: yil farki yeterli, dogum gunu sormak 60 sn kuralina girmez. */
export function age(p: Profile, now: Date): number | null {
  return p.birth_year == null ? null : now.getFullYear() - p.birth_year
}

export interface ProteinRange {
  min: number
  max: number
  /** Nereden baslanacagi: hedef kesimse ust uca, alma ise alt uca yakin. */
  start: number
}

/**
 * 1.6-2.2 g/kg. Kesimde yagsiz kutle korumasi icin ust uca yakin baslanir
 * (Helms 2014 araligi); alma fazinda fazlasi kas yapmaz, alt uc yeter.
 */
export function proteinRange(weightKg: number | null, goal: Goal | null): ProteinRange | null {
  if (weightKg == null) return null
  const factor = goal === 'cut' ? 2.0 : goal === 'gain' ? 1.6 : 1.8
  return {
    min: Math.floor(weightKg * 1.6),
    max: Math.round(weightKg * 2.2),
    start: Math.round(weightKg * factor),
  }
}

/** Cekirdek alanlar: listeler haric - alerjisi olmayan biri eksik profil degildir. */
const CORE: { key: keyof Profile; label: string }[] = [
  { key: 'birth_year', label: 'doğum yılı' },
  { key: 'height_cm', label: 'boy' },
  { key: 'sex', label: 'cinsiyet' },
  { key: 'goal', label: 'hedef' },
  { key: 'target_weight_kg', label: 'hedef kilo' },
  { key: 'training_years', label: 'antrenman geçmişi' },
  { key: 'equipment', label: 'ekipman' },
  { key: 'days_per_week', label: 'haftada kaç gün' },
  { key: 'session_min', label: 'seans süresi' },
]

function filled(v: Profile[keyof Profile]): boolean {
  return Array.isArray(v) ? v.length > 0 : v != null && v !== ''
}

export function missingFields(p: Profile): string[] {
  return CORE.filter((f) => !filled(p[f.key])).map((f) => f.label)
}

export function isProfileEmpty(p: Profile): boolean {
  return (Object.keys(EMPTY_PROFILE) as (keyof Profile)[]).every((k) => !filled(p[k]))
}

/**
 * Modele giden profil satirlari. Tani/ilac/sakatlik ayri satirlarda durur: personanin
 * "tanisi ya da ilaci varsa protokol kurma" kurali bunlari isimle gormeli.
 */
export function profileLines(p: Profile, weightKg: number | null, now: Date): string[] {
  if (isProfileEmpty(p)) {
    return [
      'profil girilmemiş: yaş, boy, hedef, tanı ve ilaç bilinmiyor — bu alanlara dayanan bir şey sorulursa sayı üretme, eksik alanı iste.',
    ]
  }
  const lines: string[] = []
  const head: string[] = []
  const years = age(p, now)
  if (years != null) head.push(`${years} yaş`)
  if (p.sex) head.push(SEX_TR[p.sex])
  if (p.height_cm != null) head.push(`${p.height_cm} cm`)
  if (p.target_weight_kg != null) head.push(`hedef ${p.target_weight_kg} kg${p.goal ? ` (${GOAL_TR[p.goal]})` : ''}`)
  else if (p.goal) head.push(`hedef ${GOAL_TR[p.goal]}`)
  if (p.training_years != null) head.push(`${p.training_years} yıl antrenman`)
  if (p.days_per_week != null) {
    head.push(`haftada ${p.days_per_week} gün${p.session_min != null ? ` × ${p.session_min} dk` : ''}`)
  }
  if (p.equipment.length > 0) head.push(`ekipman: ${p.equipment.join(', ')}`)
  if (head.length > 0) lines.push(`profil: ${head.join(' · ')}`)

  if (p.conditions.length > 0) lines.push(`tanı: ${p.conditions.join(', ')}`)
  if (p.medications.length > 0) lines.push(`ilaç: ${p.medications.join(', ')}`)
  if (p.injuries.length > 0) lines.push(`sakatlık: ${p.injuries.join(', ')}`)

  const food: string[] = []
  if (p.allergies.length > 0) food.push(`alerji: ${p.allergies.join(', ')}`)
  if (p.dislikes.length > 0) food.push(`sevmedikleri: ${p.dislikes.join(', ')}`)
  if (p.cuisine) food.push(`mutfak: ${p.cuisine}`)
  if (food.length > 0) lines.push(food.join(' · '))

  const protein = proteinRange(weightKg, p.goal)
  if (protein) {
    lines.push(`profilden protein aralığı: ${protein.min}-${protein.max} g/gün (başlangıç ${protein.start} g)`)
  }

  const missing = missingFields(p)
  if (missing.length > 0) lines.push(`profilde eksik: ${missing.join(', ')} — gerekiyorsa sor, varsayma.`)
  return lines
}

/** Profil tek ayar satiri: Dexie `settings['profile']`. Sunucudaki tabloyla ayni alanlar. */
export function useProfile(): Profile {
  const stored = useLiveQuery(() => db.settings.get('profile'), [])
  return { ...EMPTY_PROFILE, ...((stored?.value as Partial<Profile> | undefined) ?? {}) }
}

export async function loadProfile(): Promise<Profile> {
  const stored = await db.settings.get('profile')
  return { ...EMPTY_PROFILE, ...((stored?.value as Partial<Profile> | undefined) ?? {}) }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await db.settings.put({ key: 'profile', value: profile })
  await queueProfile(profile)
}

/** Sunucudaki profili yerele alir; ikinci cihaz ayni profili gorur (pullSplit gibi). */
export async function pullProfile(): Promise<void> {
  if (!hasServer()) return
  // Sunucu satiri `id` ve `updated_at` de tasir; ayar kaydina sizmasinlar.
  const row = await api<(Partial<Profile> & { id?: number; updated_at?: string }) | null>('/api/profile')
  if (!row) return
  const { id: _id, updated_at: _at, conditions, medications, injuries, dislikes, allergies, equipment, ...rest } = row
  await db.settings.put({
    key: 'profile',
    value: {
      ...EMPTY_PROFILE,
      ...rest,
      conditions: conditions ?? [],
      medications: medications ?? [],
      injuries: injuries ?? [],
      dislikes: dislikes ?? [],
      allergies: allergies ?? [],
      equipment: equipment ?? [],
    } satisfies Profile,
  })
}
