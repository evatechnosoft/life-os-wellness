import { useLiveQuery } from 'dexie-react-hooks'

import { api } from './api'
import { db } from './db'
import { hasServer, queueSplit, queueSplitNote } from './store'

/** Haftalik ajanda: gun numarasi (0 = pazar, JS getDay() ile ayni) -> kas gruplari. */
export type Split = Record<number, string[]>

export const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

export function useSplit(): Split {
  const stored = useLiveQuery(() => db.settings.get('split'), [])
  return (stored?.value as Split | undefined) ?? {}
}

/** Gun numarasi -> o gunun serbest notu (isinma, hatirlatma). Ajanda ayri tutulur. */
export type SplitNotes = Record<number, string>

export function useSplitNotes(): SplitNotes {
  const stored = useLiveQuery(() => db.settings.get('split_notes'), [])
  return (stored?.value as SplitNotes | undefined) ?? {}
}

export async function saveSplit(split: Split): Promise<void> {
  await db.settings.put({ key: 'split', value: split })
  await queueSplit(split)
}

/** Tek gunun notu. Sunucuya yalniz o gun gider; digerlerinin notu yerinde kalir. */
export async function saveSplitNote(weekday: number, note: string): Promise<void> {
  const current = ((await db.settings.get('split_notes'))?.value as SplitNotes | undefined) ?? {}
  const next = { ...current }
  const trimmed = note.trim()
  if (trimmed) next[weekday] = trimmed
  else delete next[weekday]
  await db.settings.put({ key: 'split_notes', value: next })
  await queueSplitNote(weekday, trimmed)
}

/** Sunucudaki ajandayi yerele alir; ikinci cihaz ayni programi gorur. */
export async function pullSplit(): Promise<void> {
  if (!hasServer()) return
  const rows = await api<{ weekday: number; muscle_groups: string[]; note: string | null }[]>('/api/split')
  const split: Split = {}
  const notes: SplitNotes = {}
  for (const row of rows) {
    if (row.muscle_groups.length > 0) split[row.weekday] = row.muscle_groups
    if (row.note) notes[row.weekday] = row.note
  }
  await db.settings.put({ key: 'split', value: split })
  await db.settings.put({ key: 'split_notes', value: notes })
}

/** O gunun planlanan bolgesi. Program yoksa bos dizi - "bugun serbest" demektir. */
export function groupsFor(split: Split, date: string): string[] {
  const [year, month, day] = date.split('-').map(Number)
  return split[new Date(year!, month! - 1, day!).getDay()] ?? []
}
