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
    date: DATE,
    type: { type: 'string', enum: ['resistance', 'cardio', 'walk', 'rest'] },
    duration_min: { type: ['integer', 'null'], minimum: 0, maximum: 600 },
    sets_total: { type: ['integer', 'null'], minimum: 0, maximum: 100 },
    muscle_groups: { type: 'array', items: { type: 'string', maxLength: 40 }, maxItems: 20 },
    notes: { type: ['string', 'null'], maxLength: 2000 },
  },
} as const

const DAILY_FIELDS = [
  'weight_kg',
  'protein_g',
  'steps',
  'bp_systolic',
  'bp_diastolic',
  'notes',
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
    const { rows } = await pool.query(
      `insert into workout (date, type, duration_min, sets_total, muscle_groups, notes)
       values ($1, $2, $3, $4, $5, $6) returning *`,
      [b.date, b.type, b.duration_min ?? null, b.sets_total ?? null, b.muscle_groups ?? [], b.notes ?? null],
    )
    reply.code(201)
    return rows[0]
  })

  app.delete('/api/workouts/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { rowCount } = await pool.query('delete from workout where id = $1', [id])
    if (rowCount === 0) return reply.code(404).send({ error: 'not found' })
    return reply.code(204).send()
  })

  // Whole-database dump for the JSON export acceptance criterion.
  app.get('/api/export', async () => {
    const [daily, workouts, retros, wearable] = await Promise.all([
      pool.query('select * from daily_log order by date'),
      pool.query('select * from workout order by date, created_at'),
      pool.query('select * from retro order by date'),
      pool.query('select * from wearable_sync order by date'),
    ])
    return {
      exported_at: new Date().toISOString(),
      daily_log: daily.rows,
      workout: workouts.rows,
      retro: retros.rows,
      wearable_sync: wearable.rows,
    }
  })
}
