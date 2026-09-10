import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

import { api, ApiError } from './api'
import { toLocalDate } from './date'
import { db, type Meal } from './db'
import { isNative } from './health'
import { hasServer, saveDaily } from './store'

export interface Estimate {
  items: string[]
  protein_g: number
  kcal: number
  confidence: 'low' | 'medium' | 'high'
  note?: string
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Opens the camera (or the gallery on the web) and returns the picture as a blob. */
export async function capturePhoto(): Promise<Blob> {
  const photo = await Camera.getPhoto({
    quality: 70,
    // The estimate only needs to see the plate; a smaller image keeps storage and upload sane.
    width: 1024,
    resultType: CameraResultType.Uri,
    source: isNative() ? CameraSource.Prompt : CameraSource.Photos,
  })
  if (!photo.webPath) throw new Error('Fotograf alinamadi')
  const res = await fetch(photo.webPath)
  return await res.blob()
}

async function toBase64(blob: Blob): Promise<{ media_type: string; data: string }> {
  const buffer = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (const byte of buffer) binary += String.fromCharCode(byte)
  return { media_type: blob.type || 'image/jpeg', data: btoa(binary) }
}

/**
 * Asks the server to read the plate. Returns null when no server is configured or the
 * server has no model key - the caller then falls back to typing the numbers by hand.
 * An estimate is never stored on its own: the user confirms it first.
 */
export async function estimateFromPhoto(photo: Blob): Promise<Estimate | null> {
  if (!hasServer()) return null
  const image = await toBase64(photo)
  try {
    return await api<Estimate>('/api/estimate', { method: 'POST', body: JSON.stringify({ image }) })
  } catch (err) {
    if (err instanceof ApiError && (err.status === 503 || err.status === 404)) return null
    throw err
  }
}

/** Saves the meal and adds its protein to the day's running total. */
export async function saveMeal(
  input: { protein_g: number | null; kcal: number | null; note: string | null; photo?: Blob; estimated: boolean },
  date = toLocalDate(),
): Promise<Meal> {
  const meal: Meal = { id: crypto.randomUUID(), date, time: nowTime(), ...input }
  await db.meal.put(meal)

  if (meal.protein_g != null && meal.protein_g > 0) {
    const existing = await db.daily_log.get(date)
    await saveDaily(date, { protein_g: (existing?.protein_g ?? 0) + meal.protein_g })
  }
  if (meal.kcal != null && meal.kcal > 0) {
    const meals = await db.meal.where('date').equals(date).toArray()
    const total = meals.reduce((sum, m) => sum + (m.kcal ?? 0), 0)
    const { recordMetrics } = await import('./store')
    await recordMetrics('meal_photo', date, { calories_in: total })
  }
  return meal
}

export async function deleteMeal(meal: Meal): Promise<void> {
  await db.meal.delete(meal.id)
  if (meal.protein_g != null && meal.protein_g > 0) {
    const existing = await db.daily_log.get(meal.date)
    await saveDaily(meal.date, { protein_g: Math.max(0, (existing?.protein_g ?? 0) - meal.protein_g) })
  }
}
