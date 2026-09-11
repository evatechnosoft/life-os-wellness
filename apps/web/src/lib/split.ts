import { useLiveQuery } from 'dexie-react-hooks'

import { api } from './api'
import { db } from './db'
import { hasServer, queueSplit } from './store'

/** Haftalik ajanda: gun numarasi (0 = pazar, JS getDay() ile ayni) -> kas gruplari. */
export type Split = Record<number, string[]>

export const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

export function useSplit(): Split {
  const stored = useLiveQuery(() => db.settings.get('split'), [])
  return (stored?.value as Split | undefined) ?? {}
}

export async function saveSplit(split: Split): Promise<void> {
  await db.settings.put({ key: 'split', value: split })
  await queueSplit(split)
}

/** Sunucudaki ajandayi yerele alir; ikinci cihaz ayni programi gorur. */
export async function pullSplit(): Promise<void> {
  if (!hasServer()) return
  const rows = await api<{ weekday: number; muscle_groups: string[] }[]>('/api/split')
  const split: Split = {}
  for (const row of rows) if (row.muscle_groups.length > 0) split[row.weekday] = row.muscle_groups
  await db.settings.put({ key: 'split', value: split })
}

/** O gunun planlanan bolgesi. Program yoksa bos dizi - "bugun serbest" demektir. */
export function groupsFor(split: Split, date: string): string[] {
  const [year, month, day] = date.split('-').map(Number)
  return split[new Date(year!, month! - 1, day!).getDay()] ?? []
}
