import type { WorkoutType } from './db'

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
