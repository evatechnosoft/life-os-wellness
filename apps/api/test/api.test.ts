import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

import { buildServer } from '../src/server.ts'

const TOKEN = 'test-token'
const auth = { authorization: `Bearer ${TOKEN}` }
const databaseUrl = process.env.DATABASE_URL

// Integration tests need the docker postgres from `npm run db:up && npm run db:migrate`.
describe('api', { skip: databaseUrl ? false : 'DATABASE_URL not set' }, () => {
  let app: ReturnType<typeof buildServer>['app']
  let pool: ReturnType<typeof buildServer>['pool']

  before(async () => {
    const built = buildServer({ databaseUrl: databaseUrl as string, apiToken: TOKEN })
    app = built.app
    pool = built.pool
    await app.ready()
    await pool.query("delete from daily_log where date between '2099-01-01' and '2099-12-31'")
    await pool.query("delete from workout where date between '2099-01-01' and '2099-12-31'")
    await pool.query("delete from retro where date between '2099-01-01' and '2099-12-31'")
    await pool.query("delete from wearable_sync where date between '2099-01-01' and '2099-12-31'")
  })

  after(async () => { await app.close() })

  test('rejects a request without the bearer token', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/daily?start=2099-01-01&end=2099-01-07' })
    assert.equal(res.statusCode, 401)
  })

  test('health needs no token', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    assert.equal(res.statusCode, 200)
  })

  test('rejects a malformed date', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/daily/01-02-2099', headers: auth, payload: {} })
    assert.equal(res.statusCode, 400)
  })

  test('rejects an out-of-range weight', async () => {
    const res = await app.inject({ method: 'PUT', url: '/api/daily/2099-01-01', headers: auth, payload: { weight_kg: 900 } })
    assert.equal(res.statusCode, 400)
  })

  test('upsert only overwrites the fields that were sent', async () => {
    const first = await app.inject({
      method: 'PUT', url: '/api/daily/2099-01-01', headers: auth,
      payload: { weight_kg: 82.4, protein_g: 120 },
    })
    assert.equal(first.statusCode, 200)
    assert.equal(first.json().weight_kg, 82.4)

    // Protein pulses through the day must not wipe the morning weight.
    const second = await app.inject({
      method: 'PUT', url: '/api/daily/2099-01-01', headers: auth, payload: { protein_g: 155 },
    })
    const body = second.json()
    assert.equal(body.protein_g, 155)
    assert.equal(body.weight_kg, 82.4)
    assert.equal(body.date, '2099-01-01')
  })

  test('range query returns rows in date order', async () => {
    await app.inject({ method: 'PUT', url: '/api/daily/2099-01-03', headers: auth, payload: { protein_g: 100 } })
    await app.inject({ method: 'PUT', url: '/api/daily/2099-01-02', headers: auth, payload: { protein_g: 90 } })
    const res = await app.inject({ method: 'GET', url: '/api/daily?start=2099-01-01&end=2099-01-07', headers: auth })
    const dates = res.json().map((r: { date: string }) => r.date)
    assert.deepEqual(dates, ['2099-01-01', '2099-01-02', '2099-01-03'])
  })

  test('workouts are many per day and deletable', async () => {
    const created = await app.inject({
      method: 'POST', url: '/api/workouts', headers: auth,
      payload: { date: '2099-01-01', type: 'resistance', sets_total: 12, muscle_groups: ['chest', 'back'] },
    })
    assert.equal(created.statusCode, 201)
    const second = await app.inject({
      method: 'POST', url: '/api/workouts', headers: auth,
      payload: { date: '2099-01-01', type: 'walk', duration_min: 30 },
    })
    assert.equal(second.statusCode, 201)

    const list = await app.inject({ method: 'GET', url: '/api/workouts?start=2099-01-01&end=2099-01-01', headers: auth })
    assert.equal(list.json().length, 2)

    const del = await app.inject({ method: 'DELETE', url: `/api/workouts/${created.json().id}`, headers: auth })
    assert.equal(del.statusCode, 204)
    const after = await app.inject({ method: 'GET', url: '/api/workouts?start=2099-01-01&end=2099-01-01', headers: auth })
    assert.equal(after.json().length, 1)
  })

  test('replaying the same workout id does not duplicate it', async () => {
    const id = '00000000-0000-4000-8000-000000000abc'
    const payload = { id, date: '2099-01-05', type: 'cardio', duration_min: 20 }
    const first = await app.inject({ method: 'POST', url: '/api/workouts', headers: auth, payload })
    assert.equal(first.statusCode, 201)
    const replay = await app.inject({ method: 'POST', url: '/api/workouts', headers: auth, payload })
    assert.equal(replay.statusCode, 200)
    assert.equal(replay.json().id, id)
    const list = await app.inject({ method: 'GET', url: '/api/workouts?start=2099-01-05&end=2099-01-05', headers: auth })
    assert.equal(list.json().length, 1)
  })

  test('rejects an unknown workout type', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/workouts', headers: auth, payload: { date: '2099-01-01', type: 'yoga' },
    })
    assert.equal(res.statusCode, 400)
  })

  test('retro upserts by date', async () => {
    await app.inject({ method: 'PUT', url: '/api/retro/2099-01-01', headers: auth, payload: { went_well: 'walked' } })
    const res = await app.inject({ method: 'PUT', url: '/api/retro/2099-01-01', headers: auth, payload: { experiment: 'earlier dinner' } })
    assert.equal(res.json().went_well, 'walked')
    assert.equal(res.json().experiment, 'earlier dinner')
  })

  test('wearable batch upsert replaces on replay instead of duplicating', async () => {
    const record = { date: '2099-01-06', source: 'health_connect', metric: 'steps', value: 8000 }
    const first = await app.inject({ method: 'POST', url: '/api/wearable', headers: auth, payload: { records: [record] } })
    assert.equal(first.json().written, 1)
    await app.inject({
      method: 'POST', url: '/api/wearable', headers: auth,
      payload: { records: [{ ...record, value: 12000 }] },
    })
    const list = await app.inject({ method: 'GET', url: '/api/wearable?start=2099-01-06&end=2099-01-06', headers: auth })
    assert.equal(list.json().length, 1)
    assert.equal(Number(list.json()[0].value), 12000)
  })

  test('rejects a wearable record with a bad date', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/wearable', headers: auth,
      payload: { records: [{ date: 'yesterday', source: 's', metric: 'steps', value: 1 }] },
    })
    assert.equal(res.statusCode, 400)
  })

  test('export returns every table', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/export', headers: auth })
    const body = res.json()
    assert.ok(Array.isArray(body.daily_log))
    assert.ok(Array.isArray(body.workout))
    assert.ok(Array.isArray(body.retro))
    assert.ok(Array.isArray(body.wearable_sync))
  })
})
