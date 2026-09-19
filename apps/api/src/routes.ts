import type { FastifyInstance } from 'fastify'
import type { Pool } from './db.ts'

const DATE = { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' } as const
const RANGE = {
  type: 'object',
  required: ['start', 'end'],
  properties: { start: DATE, end: DATE },
} as const

const DAILY_BODY = {
  type: 'object',
  additionalProperties: false,
  properties: {
    weight_kg: { type: ['number', 'null'], minimum: 20, maximum: 400 },
    protein_g: { type: ['integer', 'null'], minimum: 0, maximum: 1000 },
    steps: { type: ['integer', 'null'], minimum: 0, maximum: 200000 },
    bp_systolic: { type: ['integer', 'null'], minimum: 50, maximum: 300 },
    bp_diastolic: { type: ['integer', 'null'], minimum: 30, maximum: 200 },
    notes: { type: ['string', 'null'], maxLength: 2000 },
    overate: { type: ['boolean', 'null'] },
    veg_servings: { type: ['integer', 'null'], minimum: 0, maximum: 30 },
    waist_cm: { type: ['number', 'null'], minimum: 40, maximum: 200 },
  },
} as const

const RETRO_BODY = {
  type: 'object',
  additionalProperties: false,
  properties: {
    went_well: { type: ['string', 'null'], maxLength: 2000 },
    resistance: { type: ['string', 'null'], maxLength: 2000 },
    experiment: { type: ['string', 'null'], maxLength: 2000 },
  },
} as const

const WORKOUT_BODY = {
  type: 'object',
  additionalProperties: false,
  required: ['date', 'type'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    date: DATE,
    type: { type: 'string', enum: ['resistance', 'cardio', 'walk', 'rest'] },
    duration_min: { type: ['integer', 'null'], minimum: 0, maximum: 600 },
    sets_total: { type: ['integer', 'null'], minimum: 0, maximum: 100 },
    muscle_groups: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
    notes: { type: ['string', 'null'], maxLength: 2000 },
    needs_review: { type: 'boolean' },
    weight_kg: { type: ['number', 'null'], minimum: 0, maximum: 500 },
    reps_total: { type: ['integer', 'null'], minimum: 0, maximum: 1000 },
  },
} as const

const SPLIT_BODY = {
  type: 'object',
  additionalProperties: false,
  required: ['days'],
  properties: {
    days: {
      type: 'array',
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['weekday'],
        properties: {
          weekday: { type: 'integer', minimum: 0, maximum: 6 },
          muscle_groups: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
          note: { type: ['string', 'null'], maxLength: 200 },
        },
      },
    },
  },
} as const

const WEARABLE_BODY = {
  type: 'object',
  additionalProperties: false,
  required: ['records'],
  properties: {
    records: {
      type: 'array',
      maxItems: 500,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['date', 'source', 'metric', 'value'],
        properties: {
          date: DATE,
          source: { type: 'string', maxLength: 60 },
          metric: { type: 'string', maxLength: 40 },
          value: { type: 'number' },
        },
      },
    },
  },
} as const

const MEAL_BODY = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'date', 'time'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    date: DATE,
    time: { type: 'string', pattern: '^[0-2][0-9]:[0-5][0-9]$' },
    protein_g: { type: ['integer', 'null'], minimum: 0, maximum: 500 },
    kcal: { type: ['integer', 'null'], minimum: 0, maximum: 10000 },
    hunger: { type: ['integer', 'null'], minimum: 1, maximum: 10 },
    note: { type: ['string', 'null'], maxLength: 2000 },
    source: { type: ['string', 'null'], enum: ['manual', 'photo', 'barcode', 'usda', 'turkomp', null] },
    barcode: { type: ['string', 'null'], pattern: '^[0-9]{8,14}$' },
    estimated: { type: 'boolean' },
  },
} as const

const STR_LIST = { type: 'array', items: { type: 'string', maxLength: 120 }, maxItems: 40 } as const

const PROFILE_BODY = {
  type: 'object',
  additionalProperties: false,
  properties: {
    birth_year: { type: ['integer', 'null'], minimum: 1900, maximum: 2100 },
    height_cm: { type: ['integer', 'null'], minimum: 80, maximum: 250 },
    sex: { type: ['string', 'null'], enum: ['male', 'female', null] },
    goal: { type: ['string', 'null'], enum: ['cut', 'maintain', 'gain', null] },
    target_weight_kg: { type: ['number', 'null'], minimum: 20, maximum: 400 },
    training_years: { type: ['number', 'null'], minimum: 0, maximum: 80 },
    conditions: STR_LIST,
    medications: STR_LIST,
    injuries: STR_LIST,
    dislikes: STR_LIST,
    allergies: STR_LIST,
    cuisine: { type: ['string', 'null'], maxLength: 120 },
    equipment: STR_LIST,
    days_per_week: { type: ['integer', 'null'], minimum: 0, maximum: 7 },
    session_min: { type: ['integer', 'null'], minimum: 10, maximum: 240 },
  },
} as const

const DAILY_FIELDS = [
  'weight_kg',
  'protein_g',
  'steps',
  'bp_systolic',
  'bp_diastolic',
  'notes',
  'overate',
  'veg_servings',
  'waist_cm',
] as const
const PROFILE_FIELDS = [
  'birth_year', 'height_cm', 'sex', 'goal', 'target_weight_kg', 'training_years',
  'conditions', 'medications', 'injuries', 'dislikes', 'allergies', 'cuisine',
  'equipment', 'days_per_week', 'session_min',
] as const

const RETRO_FIELDS = ['went_well', 'resistance', 'experiment'] as const

/** Builds an upsert that only overwrites the columns actually sent. */
function upsert(table: string, fields: readonly string[], date: string, body: Record<string, unknown>) {
  const sent = fields.filter((f) => f in body)
  const cols = ['date', ...sent]
  const values = [date, ...sent.map((f) => body[f] ?? null)]
  const placeholders = cols.map((_, i) => `$${i + 1}`)
  const updates = sent.map((f) => `${f} = excluded.${f}`)
  const set = [...updates, 'updated_at = now()'].join(', ')
  return {
    text: `insert into ${table} (${cols.join(', ')}) values (${placeholders.join(', ')})
           on conflict (date) do update set ${set}
           returning *`,
    values,
  }
}

export function registerRoutes(app: FastifyInstance, pool: Pool): void {
  app.get('/health', async () => ({ ok: true }))

  app.get('/api/daily', { schema: { querystring: RANGE } }, async (req) => {
    const { start, end } = req.query as { start: string; end: string }
    const { rows } = await pool.query(
      'select * from daily_log where date between $1 and $2 order by date',
      [start, end],
    )
    return rows
  })

  app.put('/api/daily/:date', {
    schema: { params: { type: 'object', properties: { date: DATE } }, body: DAILY_BODY },
  }, async (req) => {
    const { date } = req.params as { date: string }
    const q = upsert('daily_log', DAILY_FIELDS, date, req.body as Record<string, unknown>)
    const { rows } = await pool.query(q.text, q.values)
    return rows[0]
  })

  app.put('/api/retro/:date', {
    schema: { params: { type: 'object', properties: { date: DATE } }, body: RETRO_BODY },
  }, async (req) => {
    const { date } = req.params as { date: string }
    const q = upsert('retro', RETRO_FIELDS, date, req.body as Record<string, unknown>)
    const { rows } = await pool.query(q.text, q.values)
    return rows[0]
  })

  app.get('/api/retro', { schema: { querystring: RANGE } }, async (req) => {
    const { start, end } = req.query as { start: string; end: string }
    const { rows } = await pool.query(
      'select * from retro where date between $1 and $2 order by date',
      [start, end],
    )
    return rows
  })

  app.get('/api/workouts', { schema: { querystring: RANGE } }, async (req) => {
    const { start, end } = req.query as { start: string; end: string }
    const { rows } = await pool.query(
      'select * from workout where date between $1 and $2 order by date, created_at',
      [start, end],
    )
    return rows
  })

  app.post('/api/workouts', { schema: { body: WORKOUT_BODY } }, async (req, reply) => {
    const b = req.body as Record<string, unknown>
    // The client supplies the id so a replayed offline queue cannot create duplicates.
    // Ayni id ikinci kez gelirse uzerine yazilir: saatin bulduğu seansi kullanici
    // "bu neydi?" karti uzerinden tamamlayinca ayni satir guncellenmeli.
    const { rows } = await pool.query(
      `insert into workout (id, date, type, duration_min, sets_total, muscle_groups, notes, needs_review, weight_kg, reps_total)
       values (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (id) do update set
         type = excluded.type, duration_min = excluded.duration_min, sets_total = excluded.sets_total,
         muscle_groups = excluded.muscle_groups, notes = excluded.notes,
         -- Bir kez onaylandiysa onayli kalir: disa aktarimi ikinci kez almak
         -- kullanicinin tamamladigi seansi yeniden "bu neydi?" yapmasin.
         needs_review = workout.needs_review and excluded.needs_review,
         weight_kg = excluded.weight_kg, reps_total = excluded.reps_total
       -- xmax = 0 yalniz yeni eklenen satirda dogru; guncelleme 200 donsun diye.
       returning *, (xmax = 0) as inserted`,
      [
        b.id ?? null, b.date, b.type, b.duration_min ?? null, b.sets_total ?? null,
        b.muscle_groups ?? [], b.notes ?? null, b.needs_review ?? false, b.weight_kg ?? null,
        b.reps_total ?? null,
      ],
    )
    const { inserted, ...workout } = rows[0]
    reply.code(inserted ? 201 : 200)
    return workout
  })

  app.delete('/api/workouts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { rowCount } = await pool.query('delete from workout where id = $1', [id])
    if (rowCount === 0) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  // Haftalik antrenman ajandasi. En fazla yedi satir, tumu birden okunur/yazilir:
  // gun bazli uc acmak tek kullanicili bir tablo icin gereksiz.
  app.get('/api/split', async () => {
    const { rows } = await pool.query('select weekday, muscle_groups, note from training_split order by weekday')
    return rows
  })

  app.put('/api/split', { schema: { body: SPLIT_BODY } }, async (req) => {
    const { days } = req.body as { days: { weekday: number; muscle_groups?: string[]; note?: string | null }[] }
    for (const day of days) {
      await pool.query(
        `insert into training_split (weekday, muscle_groups, note) values ($1, $2, $3)
         on conflict (weekday) do update set
           muscle_groups = excluded.muscle_groups, note = excluded.note, updated_at = now()`,
        [day.weekday, day.muscle_groups ?? [], day.note ?? null],
      )
    }
    const { rows } = await pool.query('select weekday, muscle_groups, note from training_split order by weekday')
    return rows
  })

  // Profil tek satir (db/006): kullanici tablosu yok, auth yok. Bos satir da
  // donulur ki istemci "profil hic girilmemis" ile "sunucu yok"u ayirt edebilsin.
  app.get('/api/profile', async () => {
    const { rows } = await pool.query('select * from profile where id = 1')
    return rows[0] ?? null
  })

  app.put('/api/profile', { schema: { body: PROFILE_BODY } }, async (req) => {
    const body = req.body as Record<string, unknown>
    const cols = PROFILE_FIELDS.filter((f) => f in body)
    const values = cols.map((f) => body[f])
    const insertCols = ['id', ...cols].join(', ')
    const placeholders = ['1', ...cols.map((_, i) => `$${i + 1}`)].join(', ')
    const updates = [...cols.map((c, i) => `${c} = $${i + 1}`), 'updated_at = now()'].join(', ')
    const { rows } = await pool.query(
      `insert into profile (${insertCols}) values (${placeholders})
       on conflict (id) do update set ${updates} returning *`,
      values,
    )
    return rows[0]
  })

  app.get('/api/wearable', { schema: { querystring: RANGE } }, async (req) => {
    const { start, end } = req.query as { start: string; end: string }
    const { rows } = await pool.query(
      'select * from wearable_sync where date between $1 and $2 order by date, metric',
      [start, end],
    )
    return rows
  })

  // Batch upsert from the phone. (date, source, metric) is unique, so replaying a sync
  // window overwrites rather than duplicating.
  app.post('/api/wearable', { schema: { body: WEARABLE_BODY } }, async (req) => {
    const { records } = req.body as { records: { date: string; source: string; metric: string; value: number }[] }
    if (records.length === 0) return { written: 0 }
    const values: unknown[] = []
    const tuples = records.map((r, i) => {
      values.push(r.date, r.source, r.metric, r.value)
      const at = i * 4
      return `($${at + 1}, $${at + 2}, $${at + 3}, $${at + 4})`
    })
    await pool.query(
      `insert into wearable_sync (date, source, metric, value) values ${tuples.join(', ')}
       on conflict (date, source, metric) do update set value = excluded.value, synced_at = now()`,
      values,
    )
    return { written: records.length }
  })

  app.get('/api/meals', { schema: { querystring: RANGE } }, async (req) => {
    const { start, end } = req.query as { start: string; end: string }
    const { rows } = await pool.query(
      'select * from meal where date between $1 and $2 order by date, time',
      [start, end],
    )
    return rows
  })

  // Fotograf telefonda kalir; buraya yalniz sayilar gelir. Id istemciden geldigi
  // icin kuyrugun yeniden oynatilmasi satiri cogaltmaz, uzerine yazar.
  app.post('/api/meals', { schema: { body: MEAL_BODY } }, async (req, reply) => {
    const b = req.body as Record<string, unknown>
    const { rows } = await pool.query(
      `insert into meal (id, date, time, protein_g, kcal, hunger, note, source, barcode, estimated)
       values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       on conflict (id) do update set
         date = excluded.date, time = excluded.time, protein_g = excluded.protein_g,
         kcal = excluded.kcal, hunger = excluded.hunger, note = excluded.note,
         source = excluded.source, barcode = excluded.barcode, estimated = excluded.estimated
       returning *, (xmax = 0) as inserted`,
      [
        b.id, b.date, b.time, b.protein_g ?? null, b.kcal ?? null, b.hunger ?? null,
        b.note ?? null, b.source ?? null, b.barcode ?? null, b.estimated ?? false,
      ],
    )
    const { inserted, ...meal } = rows[0]
    reply.code(inserted ? 201 : 200)
    return meal
  })

  app.delete('/api/meals/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { rowCount } = await pool.query('delete from meal where id = $1', [id])
    if (rowCount === 0) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  // Whole-database dump for the JSON export acceptance criterion.
  app.get('/api/export', async () => {
    const [daily, workouts, retros, wearable, meals, profile] = await Promise.all([
      pool.query('select * from daily_log order by date'),
      pool.query('select * from workout order by date, created_at'),
      pool.query('select * from retro order by date'),
      pool.query('select * from wearable_sync order by date'),
      pool.query('select * from meal order by date, time'),
      pool.query('select * from profile where id = 1'),
    ])
    return {
      exported_at: new Date().toISOString(),
      daily_log: daily.rows,
      workout: workouts.rows,
      retro: retros.rows,
      wearable_sync: wearable.rows,
      meal: meals.rows,
      profile: profile.rows[0] ?? null,
    }
  })
}
