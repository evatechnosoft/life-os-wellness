import type { WorkoutType } from './db'
import { foldTr } from './nutrition'
import type { NoteDraft } from './voice'

/**
 * Dogal cumleden antrenman turu + kas grubu cikarimi. Saf fonksiyon, yerel ag:
 * Eva'nin <kayit> taslaginda bolge bos gelirse cumleden doldurulur, model ikinci
 * kez cagrilmaz. Eslesmeyen cumle bos doner - AGENTS: tahmin, veri yoklugunu gizler.
 *
 * `exercise.ts` saatin verdigi seans tipini cevirir; burasi kullanicinin cumlesini.
 */

/** Egzersiz adi -> bolge. Anahtarlar tam kelime eslesir: "kol" var, "kolay" yok. */
const MUSCLES: [group: string, words: string[]][] = [
  ['göğüs', ['gogus', 'bench', 'benc', 'sinav', 'dips', 'fly', 'pec']],
  ['sırt', ['sirt', 'lat', 'barfiks', 'row', 'kurek', 'deadlift', 'pulldown', 'pull-up']],
  ['bacak', ['bacak', 'squat', 'skuat', 'leg', 'lunge', 'hamstring', 'quadriceps', 'kalca', 'baldir', 'calf']],
  ['omuz', ['omuz', 'shoulder', 'lateral', 'deltoid', 'arnold', 'military']],
  ['kol', ['kol', 'biceps', 'biseps', 'triceps', 'triseps', 'curl', 'pazi']],
  ['karın', ['karin', 'abs', 'plank', 'mekik', 'crunch']],
]

/** Tur ipuclari on ek eslesir: "bisiklete", "yuzuyorum", "kostum" hepsi tutar. */
const TYPES: [type: WorkoutType, stems: string[]][] = [
  ['walk', ['yuru']],
  ['cardio', ['yuz', 'kos', 'bisiklet', 'kardiyo', 'eliptik', 'kurek cek']],
  ['rest', ['dinlen']],
  ['resistance', ['kaldir', 'antrenman', 'agirlik', 'set', 'kg']],
]

export interface ExerciseGuess {
  type: WorkoutType | null
  muscle_groups: string[]
}

export function classifyExercise(text: string): ExerciseGuess {
  const folded = ` ${foldTr(text)} `
  const groups = MUSCLES.filter(([, words]) =>
    words.some((w) => new RegExp(`(?<![a-z0-9])${w}(?![a-z0-9])`).test(folded)),
  ).map(([group]) => group)

  const hit = TYPES.find(([, stems]) => stems.some((s) => folded.includes(` ${s}`)))
  const type = hit?.[0] ?? (groups.length > 0 ? 'resistance' : null)
  return { type, muscle_groups: groups }
}

const VALID: WorkoutType[] = ['resistance', 'cardio', 'walk', 'rest']

/**
 * Model bolgeyi bos biraktiysa ya da gecersiz bir tur yazdiysa cumleden tamamlar.
 * Sayi eklemez: set/tekrar/agirlik/sure yalnizca kullanicinin soyledigi kadardir.
 */
export function fillWorkout(draft: NoteDraft | null, text: string): NoteDraft | null {
  if (!draft?.workout) return draft
  const w = draft.workout
  const guess = classifyExercise(text)
  return {
    ...draft,
    // Kaldirilan agirligi vucut kilosu sanmak 7-gun ortalamasini bozar; ikisi ayni
    // sayiysa bu model hatasidir, tartinin degeri degil.
    weight_kg: draft.weight_kg != null && draft.weight_kg === w.weight_kg ? null : draft.weight_kg,
    workout: {
      ...w,
      type: VALID.includes(w.type) ? w.type : (guess.type ?? 'resistance'),
      muscle_groups: w.muscle_groups?.length ? w.muscle_groups : guess.muscle_groups,
    },
  }
}
