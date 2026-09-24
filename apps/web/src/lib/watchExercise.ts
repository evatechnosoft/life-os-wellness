import type { Workout, WorkoutType } from './db'

/**
 * Health Connect egzersiz tipi -> bizim dort kovamiz + Turkce ad.
 *
 * Saat seansin tipini biliyor (capacitor-health `workoutType` alani,
 * ExerciseSessionRecord.exerciseType'in adi). Bildigi zaman sormaya gerek yok,
 * onaylatmak yeter. Bilmedigimiz ya da dort kovaya sigmayan tip icin **uydurma
 * yapilmaz** - null doner, kayit `needs_review` kalir ve kullaniciya sorulur.
 *
 * Yoga/pilates/esneme bilerek disarida: gercek antrenman ama ne direnc ne
 * kardiyo, MET tahmini de tutmaz (metrics.ts). Kullanici kendi soylesin.
 */
const EXERCISES: Record<string, { type: WorkoutType; label: string }> = {
  STRENGTH_TRAINING: { type: 'resistance', label: 'Kuvvet antrenmanı' },
  WEIGHTLIFTING: { type: 'resistance', label: 'Ağırlık' },
  CALISTHENICS: { type: 'resistance', label: 'Kendi ağırlığı' },

  WALKING: { type: 'walk', label: 'Yürüyüş' },
  HIKING: { type: 'walk', label: 'Doğa yürüyüşü' },
  STAIR_CLIMBING: { type: 'walk', label: 'Merdiven' },
  STAIR_CLIMBING_MACHINE: { type: 'walk', label: 'Merdiven makinesi' },

  RUNNING: { type: 'cardio', label: 'Koşu' },
  RUNNING_TREADMILL: { type: 'cardio', label: 'Koşu bandı' },
  BIKING: { type: 'cardio', label: 'Bisiklet' },
  BIKING_STATIONARY: { type: 'cardio', label: 'Sabit bisiklet' },
  SWIMMING_POOL: { type: 'cardio', label: 'Yüzme' },
  SWIMMING_OPEN_WATER: { type: 'cardio', label: 'Açık su yüzme' },
  ROWING: { type: 'cardio', label: 'Kürek' },
  ROWING_MACHINE: { type: 'cardio', label: 'Kürek makinesi' },
  ELLIPTICAL: { type: 'cardio', label: 'Eliptik' },
  HIGH_INTENSITY_INTERVAL_TRAINING: { type: 'cardio', label: 'HIIT' },
  BOOT_CAMP: { type: 'cardio', label: 'Boot camp' },
  EXERCISE_CLASS: { type: 'cardio', label: 'Grup dersi' },
  DANCING: { type: 'cardio', label: 'Dans' },
  BOXING: { type: 'cardio', label: 'Boks' },
  MARTIAL_ARTS: { type: 'cardio', label: 'Dövüş sanatları' },
  BASKETBALL: { type: 'cardio', label: 'Basketbol' },
  SOCCER: { type: 'cardio', label: 'Futbol' },
  TENNIS: { type: 'cardio', label: 'Tenis' },
  TABLE_TENNIS: { type: 'cardio', label: 'Masa tenisi' },
  BADMINTON: { type: 'cardio', label: 'Badminton' },
  SQUASH: { type: 'cardio', label: 'Squash' },
  VOLLEYBALL: { type: 'cardio', label: 'Voleybol' },
  SKIING: { type: 'cardio', label: 'Kayak' },
  SNOWBOARDING: { type: 'cardio', label: 'Snowboard' },
  ICE_SKATING: { type: 'cardio', label: 'Buz pateni' },
  SKATING: { type: 'cardio', label: 'Paten' },
  PADDLING: { type: 'cardio', label: 'Kano' },
  SURFING: { type: 'cardio', label: 'Sörf' },
  ROCK_CLIMBING: { type: 'cardio', label: 'Tırmanış' },
}

/** Saatin tanidigi seans tipi; tanimadigimiz tip null doner (sorulacak demektir). */
export function detectedExercise(name: string): { type: WorkoutType; label: string } | null {
  return EXERCISES[name.trim().toUpperCase()] ?? null
}

/**
 * Health Connect `ExerciseSegment.segmentType` (int sabit) -> bizim kas gruplarimiz
 * (Settings/WorkoutForm ile ayni alti kelime).
 *
 * Sema tekrari ve hareketi tasiyor (`getRepetitions()`), ama bu alani dolduran bir
 * uretici uygulama **dogrulanmadi** (docs/SENSORS-FEASIBILITY.md 4.3) - bos gelmesi
 * beklenen durum. Dolu gelirse `Workout.reps_total` ve `muscle_groups` bedava dolar.
 *
 * Kova belirsizse **uydurma yok**, null doner: WEIGHTLIFTING gibi genel bir tip hangi
 * kasi calistirdigini soylemiyor, REST/PAUSE zaten hareket degil.
 */
const SEGMENT_MUSCLES: Record<number, string[]> = {
  1: ['kol'], // ARM_CURL
  2: ['sırt'], // BACK_EXTENSION
  4: ['omuz'], // BARBELL_SHOULDER_PRESS
  5: ['göğüs'], // BENCH_PRESS
  6: ['karın'], // BENCH_SIT_UP
  10: ['karın'], // CRUNCH
  11: ['sırt', 'bacak'], // DEADLIFT
  12: ['kol'], // DOUBLE_ARM_TRICEPS_EXTENSION
  13: ['kol'], // DUMBBELL_CURL_LEFT_ARM
  14: ['kol'], // DUMBBELL_CURL_RIGHT_ARM
  15: ['omuz'], // DUMBBELL_FRONT_RAISE
  16: ['omuz'], // DUMBBELL_LATERAL_RAISE
  17: ['sırt'], // DUMBBELL_ROW
  18: ['kol'], // DUMBBELL_TRICEPS_EXTENSION_LEFT_ARM
  19: ['kol'], // DUMBBELL_TRICEPS_EXTENSION_RIGHT_ARM
  20: ['kol'], // DUMBBELL_TRICEPS_EXTENSION_TWO_ARM
  22: ['karın'], // FORWARD_TWIST
  23: ['omuz'], // FRONT_RAISE
  25: ['bacak'], // HIP_THRUST
  29: ['sırt', 'bacak'], // KETTLEBELL_SWING
  30: ['omuz'], // LATERAL_RAISE
  31: ['sırt'], // LAT_PULL_DOWN
  32: ['bacak'], // LEG_CURL
  33: ['bacak'], // LEG_EXTENSION
  34: ['bacak'], // LEG_PRESS
  35: ['karın'], // LEG_RAISE
  36: ['bacak'], // LUNGE
  41: ['karın'], // PLANK
  42: ['sırt'], // PULL_UP
  48: ['omuz'], // SHOULDER_PRESS
  49: ['kol'], // SINGLE_ARM_TRICEPS_EXTENSION
  50: ['karın'], // SIT_UP
  51: ['bacak'], // SQUAT
  63: ['karın'], // UPPER_TWIST
}

/** Tek segment tipinin kas gruplari; bilmedigimiz tip null (uydurulmaz). */
export function segmentMuscles(type: number): string[] | null {
  return SEGMENT_MUSCLES[type] ?? null
}

/** Bir seansin butun segment tiplerinden tekrarsiz kas grubu listesi. */
export function segmentMusclesOf(types: number[]): string[] {
  const groups: string[] = []
  for (const type of types) {
    for (const muscle of segmentMuscles(type) ?? []) {
      if (!groups.includes(muscle)) groups.push(muscle)
    }
  }
  return groups
}

/**
 * Kullanici bu kaydi onayladi mi? Onaylandiysa saat senkronu ona **dokunmaz**:
 * her 15 dk ayni stableId ile yeniden yazmak girilen set/agirlik/tipi siliyordu.
 * needs_review alani olmayan eski kayit da kullanicinin sayilir.
 */
export function isAnswered(existing: Pick<Workout, 'needs_review'> | undefined): boolean {
  return existing !== undefined && existing.needs_review !== true
}
