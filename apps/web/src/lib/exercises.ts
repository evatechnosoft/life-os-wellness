import catalog from '../data/exercises.json'

/**
 * Egzersiz kutuphanesi. Veri `scripts/build-exercises.mjs` ile uretilir
 * (kaynak: yuhonas/free-exercise-db, Unlicense/kamu mali) ve derlemeye gomulur -
 * ag olmadan da acilsin diye. Gorseller gomulmez, URL olarak durur.
 *
 * Burasi saf: dosyaya da ekrana da dokunmaz, yalniz filtreler.
 */

export interface Media {
  type: string
  url: string
}

/** Fotograf uzeri vurgu. x/y/r resmin yuzdesi; far = govdenin arka tarafinda kalan bolge. */
export interface Spot {
  region: string
  x: number
  y: number
  r: number
  far?: boolean
}

export interface Exercise {
  id: string
  name: string
  name_en: string
  equipment: string
  equipment_tr: string
  level: string
  mechanic: string
  /** strength / stretching / cardio. Eski katalogda yok. */
  category?: string
  /** push / pull / static; kardiyoda null. Eski katalogda yok. */
  force?: string | null
  primary: string[]
  primary_tr: string[]
  secondary: string[]
  secondary_tr: string[]
  instructions: string[]
  /** Elle eklenen katman: yuk binen / korunacak nokta. Kas listesi degil. */
  load: string[]
  /** Elle eklenen katman: tek cumlelik Turkce uyari. */
  cue: string
  /** Baslangic ve bitis karesi. Dizi kasten acik: yarin GIF/video eklenirse kart degil kaynak degisir. */
  media: Media[]
  /** Kare basina vurgu noktalari. Bos = o kareye henuz bakilmadi, ekran figure duser. */
  focus: Spot[][]
}

/**
 * Yayindaki katalog. Gomulu JSON acilis degeridir; `applyCatalog` sunucudan gelen
 * surumle degistirir (`catalog.ts`). ES modul baglantisi canli oldugu icin
 * iceri aktaran her dosya guncel diziyi gorur.
 */
export let EXERCISES: Exercise[] = (catalog as { exercises: Exercise[] }).exercises

/**
 * Disaridan gelen katalogu yayina alir. Bozuk/bos veri sessizce reddedilir -
 * yarim bir katalog, gomulu tam katalogdan kotudur.
 */
export function applyCatalog(data: unknown): boolean {
  const list = (data as { exercises?: unknown } | null)?.exercises
  if (!Array.isArray(list) || list.length === 0) return false
  const valid = list.every(
    (e) => typeof (e as Exercise)?.id === 'string' && typeof (e as Exercise)?.name === 'string',
  )
  if (!valid) return false
  EXERCISES = list as Exercise[]
  return true
}

/** Upstream kas adi -> vucut haritasi bolgesi. Haritada karsiligi olmayan ad aynen gecer. */
const REGION: Record<string, string> = {
  chest: 'gogus',
  lats: 'sirt',
  'middle back': 'sirt',
  traps: 'sirt',
  'lower back': 'bel',
  shoulders: 'omuz',
  biceps: 'kol',
  triceps: 'kol',
  forearms: 'onkol',
  abdominals: 'karin',
  quadriceps: 'onBacak',
  hamstrings: 'arkaBacak',
  glutes: 'kalca',
  abductors: 'kalca',
  adductors: 'kalca',
  calves: 'baldir',
  neck: 'boyun',
}

/** Arama icin: buyuk-kucuk ve Turkce karakter farki sonucu degistirmesin. */
function fold(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .replaceAll('ı', 'i')
    .replaceAll('ş', 's')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
}

export function find(id: string): Exercise | null {
  return EXERCISES.find((e) => e.id === id) ?? null
}

export function byEquipment(equipment: string): Exercise[] {
  return EXERCISES.filter((e) => e.equipment === equipment)
}

export function byMuscle(muscle: string, opts: { includeSecondary?: boolean } = {}): Exercise[] {
  // Ikincil kas varsayilan olarak sayilmaz: bench press'i "omuz hareketi" saymak
  // haftalik set sayimini sisirir ve coach.ts yanlis uyari verir.
  return EXERCISES.filter(
    (e) => e.primary.includes(muscle) || (opts.includeSecondary === true && e.secondary_tr.includes(muscle)),
  )
}

/**
 * Germe / kardiyo / kuvvet. `mechanic` bunu tasiyamiyor: ayak bilegi ve kalca
 * cemberi upstream'de `isolation`. Eski onbellekte category yoksa mechanic'e duser.
 */
const kind = (e: Exercise): string => e.category ?? (e.mechanic === 'other' ? 'stretching' : 'strength')

/** Kurek/pulldown ayni sirt cekisi; upstream birine lats, digerine middle back diyor. */
const MUSCLE_GROUP: Record<string, string> = { 'middle back': 'lats' }
const group = (m: string): string => MUSCLE_GROUP[m] ?? m

/**
 * "Bu makine dolu / bende yok" sorusunun cevabi: ayni kasi ayni yonde calistiran baskalari.
 * - Tur ayni: kuvvetin yerine germe/bisiklet, germenin yerine kuvvet onerilmez.
 * - Yon ayni: omuz presinin yerine face pull onerilmez. static (plank) her yone uyar.
 */
export function alternatives(id: string, opts: { equipment?: string[] } = {}): Exercise[] {
  const source = find(id)
  if (source === null) return []
  const muscles = source.primary.map(group)
  const sameForce = (e: Exercise): boolean =>
    e.force === source.force ||
    [e.force, source.force].some((f) => f === undefined || f === null || f === 'static')
  return EXERCISES.filter(
    (e) =>
      e.id !== id &&
      kind(e) === kind(source) &&
      sameForce(e) &&
      e.primary.some((m) => muscles.includes(group(m))) &&
      (opts.equipment === undefined || opts.equipment.includes(e.equipment)),
  )
}

export interface Regions {
  primary: string[]
  support: string[]
  load: string[]
}

/**
 * Kas adlarini vucut haritasi bolgelerine cevirir. `load` ayri bir katman:
 * ayni bolge hem destek hem yuk noktasi olabilir (pallof'ta omuz), o yuzden
 * listeler birbirini dislamaz - ekran ikisini birden cizer.
 */
export function regionsFor(ex: Exercise): Regions {
  const map = (names: string[]): string[] => [...new Set(names.map((n) => REGION[n] ?? n))]
  const primary = map(ex.primary)
  return {
    primary,
    // Birincil bolge ayni zamanda ikincilse yesil kazanir - iki dolgu ust uste binmesin.
    support: map(ex.secondary).filter((r) => !primary.includes(r)),
    load: map(ex.load),
  }
}

export function search(query: string): Exercise[] {
  const q = fold(query.trim())
  if (q === '') return EXERCISES
  return EXERCISES.filter((e) => fold(e.name).includes(q) || fold(e.name_en).includes(q))
}

/** Bolgenin karttaki rolu: vurgunun rengini bu belirler. */
export function roleOf(region: string, r: Regions): 'work' | 'assist' | 'load' | null {
  if (r.primary.includes(region)) return 'work'
  if (r.support.includes(region)) return 'assist'
  if (r.load.includes(region)) return 'load'
  return null
}
