import Dexie, { type EntityTable } from 'dexie'

export interface DailyLog {
  date: string
  weight_kg?: number | null
  protein_g?: number | null
  steps?: number | null
  bp_systolic?: number | null
  bp_diastolic?: number | null
  notes?: string | null
  updated_at: string
}

export type WorkoutType = 'resistance' | 'cardio' | 'walk' | 'rest'

export interface Workout {
  id: string
  date: string
  type: WorkoutType
  duration_min?: number | null
  sets_total?: number | null
  muscle_groups: string[]
  notes?: string | null
}

export interface Retro {
  date: string
  went_well?: string | null
  resistance?: string | null
  experiment?: string | null
  updated_at: string
}

/** Pending writes for the server. Drained by the Sprint 2 sync loop; entries survive a reload. */
export interface OutboxEntry {
  id?: number
  method: 'PUT' | 'POST' | 'DELETE'
  path: string
  body?: unknown
  queued_at: string
}

export interface Settings {
  key: string
  value: unknown
}

// IndexedDB is the source of truth while offline: every write lands here first.
export const db = new Dexie('wellness') as Dexie & {
  daily_log: EntityTable<DailyLog, 'date'>
  workout: EntityTable<Workout, 'id'>
  retro: EntityTable<Retro, 'date'>
  outbox: EntityTable<OutboxEntry, 'id'>
  settings: EntityTable<Settings, 'key'>
}

db.version(1).stores({
  daily_log: 'date',
  workout: 'id, date',
  retro: 'date',
  outbox: '++id, queued_at',
  settings: 'key',
})
