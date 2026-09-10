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

/** One aggregated value per day+metric, read from the watch via Health Connect. */
export interface WearableRecord {
  /** `${date}:${metric}` - one row per day and metric, so a re-sync overwrites. */
  id: string
  date: string
  metric: string
  value: number
  source: string
  synced_at: string
}

/** One logged meal. The photo stays on the device; only the numbers ever sync. */
export interface Meal {
  id: string
  date: string
  /** Local time HH:MM, for ordering within the day. */
  time: string
  protein_g: number | null
  kcal: number | null
  note: string | null
  photo?: Blob
  /** Set when the numbers came from a photo estimate the user accepted. */
  estimated: boolean
}

/** Every note you typed or spoke, kept as a plain log - not a chat transcript on screen. */
export interface NoteEntry {
  id: string
  date: string
  /** Local HH:MM. */
  at: string
  via: 'text' | 'voice'
  text: string
  /** One-line summary the model gave back, when a server was configured. */
  summary?: string
  /** What was actually written to the day, in plain Turkish. */
  applied: string[]
}

/** One turn of the conversation. Voice, typed and photo turns all land here. */
export interface ChatMessage {
  id: string
  date: string
  at: string
  role: 'user' | 'eva'
  text: string
  via: 'text' | 'voice' | 'photo'
  sources?: { title: string; url: string }[]
  /** A proposed entry the user can still accept. */
  draft?: unknown
  /** Set once accepted: what was written, in plain Turkish. */
  applied?: string[]
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
  wearable: EntityTable<WearableRecord, 'id'>
  meal: EntityTable<Meal, 'id'>
  note_log: EntityTable<NoteEntry, 'id'>
  chat: EntityTable<ChatMessage, 'id'>
}

db.version(1).stores({
  daily_log: 'date',
  workout: 'id, date',
  retro: 'date',
  outbox: '++id, queued_at',
  settings: 'key',
})

// Watch data lives apart from the manual daily_log on purpose (SPEC 3).
db.version(2).stores({
  wearable: 'id, date, metric',
})

db.version(3).stores({
  meal: 'id, date',
})

db.version(4).stores({
  note_log: 'id, date, at',
})

db.version(5).stores({
  chat: 'id, date',
})
