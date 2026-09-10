import { SpeechRecognition } from '@capacitor-community/speech-recognition'

import { api, ApiError } from './api'
import { toLocalDate } from './date'
import { db, type NoteEntry, type WorkoutType } from './db'
import { isNative } from './health'
import { saveMeal } from './meals'
import { addWorkout, hasServer, saveDaily, saveRetro } from './store'

export interface NoteDraft {
  weight_kg?: number | null
  protein_g?: number | null
  kcal?: number | null
  steps?: number | null
  bp_systolic?: number | null
  bp_diastolic?: number | null
  workout?: { type: WorkoutType; duration_min?: number | null; sets_total?: number | null; muscle_groups?: string[] } | null
  retro?: { went_well?: string | null; resistance?: string | null; experiment?: string | null } | null
  meal_note?: string | null
  summary: string
}

export async function voiceAvailable(): Promise<boolean> {
  if (!isNative()) return false
  const { available } = await SpeechRecognition.available()
  return available
}

/** Listens once and returns what was heard. Speech-to-text runs on the phone. */
export async function listenOnce(): Promise<string> {
  const permission = await SpeechRecognition.checkPermissions()
  if (permission.speechRecognition !== 'granted') {
    const asked = await SpeechRecognition.requestPermissions()
    if (asked.speechRecognition !== 'granted') throw new Error('Mikrofon izni verilmedi')
  }
  const { matches } = await SpeechRecognition.start({
    language: 'tr-TR',
    maxResults: 1,
    partialResults: false,
    popup: false,
  })
  const heard = matches?.[0]?.trim()
  if (!heard) throw new Error('Bir şey duyamadım')
  return heard
}

export function stopListening(): Promise<void> {
  return SpeechRecognition.stop()
}

/** Sends the transcript to the server to be understood. Null when no server is configured. */
export async function understand(text: string): Promise<NoteDraft | null> {
  if (!hasServer()) return null
  try {
    const reply = await api<{ text: string; draft: NoteDraft | null }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: text }] }),
    })
    if (!reply.draft) return null
    return { ...reply.draft, summary: reply.draft.summary || reply.text }
  } catch (err) {
    if (err instanceof ApiError && (err.status === 503 || err.status === 404)) return null
    throw err
  }
}

/** What the draft would change, in plain Turkish, so the user sees it before confirming. */
export function draftLines(draft: NoteDraft): string[] {
  const lines: string[] = []
  if (draft.weight_kg != null) lines.push(`Kilo: ${draft.weight_kg} kg`)
  if (draft.protein_g != null) lines.push(`Protein: +${draft.protein_g} g`)
  if (draft.kcal != null) lines.push(`Kalori: ${draft.kcal} kcal`)
  if (draft.steps != null) lines.push(`Adım: ${draft.steps}`)
  if (draft.bp_systolic != null || draft.bp_diastolic != null) {
    lines.push(`Tansiyon: ${draft.bp_systolic ?? '?'}/${draft.bp_diastolic ?? '?'}`)
  }
  if (draft.workout) {
    const parts: string[] = [draft.workout.type]
    if (draft.workout.sets_total) parts.push(`${draft.workout.sets_total} set`)
    if (draft.workout.duration_min) parts.push(`${draft.workout.duration_min} dk`)
    if (draft.workout.muscle_groups?.length) parts.push(draft.workout.muscle_groups.join(', '))
    lines.push(`Antrenman: ${parts.join(' · ')}`)
  }
  if (draft.meal_note) lines.push(`Öğün: ${draft.meal_note}`)
  if (draft.retro) {
    const filled = Object.values(draft.retro).filter(Boolean).length
    if (filled > 0) lines.push('Akşam retrosu güncellenecek')
  }
  return lines
}

/** Keeps what was said or typed, plus what it changed. Read back from the Ayar screen. */
export async function logNote(
  entry: { via: 'text' | 'voice'; text: string; summary?: string; applied: string[] },
  date = toLocalDate(),
): Promise<void> {
  const now = new Date()
  const note: NoteEntry = {
    id: crypto.randomUUID(),
    date,
    at: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    ...entry,
  }
  await db.note_log.put(note)
}

/** Applies a confirmed draft. Protein adds to the day's total; it never replaces it. */
export async function applyDraft(draft: NoteDraft, date = toLocalDate()): Promise<void> {
  const daily: Record<string, number> = {}
  if (draft.weight_kg != null) daily.weight_kg = draft.weight_kg
  if (draft.steps != null) daily.steps = draft.steps
  if (draft.bp_systolic != null) daily.bp_systolic = draft.bp_systolic
  if (draft.bp_diastolic != null) daily.bp_diastolic = draft.bp_diastolic
  if (Object.keys(daily).length > 0) await saveDaily(date, daily)

  if (draft.meal_note || draft.protein_g != null || draft.kcal != null) {
    await saveMeal(
      {
        protein_g: draft.protein_g ?? null,
        kcal: draft.kcal ?? null,
        note: draft.meal_note ?? null,
        estimated: true,
      },
      date,
    )
  } else if (draft.protein_g != null) {
    const existing = draft.protein_g
    await saveDaily(date, { protein_g: existing })
  }

  if (draft.workout) {
    await addWorkout({
      date,
      type: draft.workout.type,
      duration_min: draft.workout.duration_min ?? null,
      sets_total: draft.workout.sets_total ?? null,
      muscle_groups: draft.workout.muscle_groups ?? [],
      notes: 'sesli not',
    })
  }

  if (draft.retro) {
    const retro = Object.fromEntries(Object.entries(draft.retro).filter(([, v]) => v))
    if (Object.keys(retro).length > 0) await saveRetro(date, retro)
  }
}
