import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'

import { parseEstimate } from '../src/estimate.ts'
import { splitReply } from '../src/chat.ts'
import { collectSources } from '../src/llm.ts'
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

  test('a confirmed session is not sent back for review', async () => {
    const id = '00000000-0000-4000-8000-0000000000de'
    const watch = { id, date: '2099-01-06', type: 'cardio', duration_min: 11, needs_review: true }
    await app.inject({ method: 'POST', url: '/api/workouts', headers: auth, payload: watch })
    const confirmed = await app.inject({
      method: 'POST', url: '/api/workouts', headers: auth,
      payload: { ...watch, type: 'resistance', sets_total: 3, weight_kg: 40, needs_review: false },
    })
    assert.equal(confirmed.json().needs_review, false)
    assert.equal(Number(confirmed.json().weight_kg), 40)
    // Disa aktarim ikinci kez alinirsa saat yine needs_review gonderir; onay bozulmamali.
    const reimport = await app.inject({ method: 'POST', url: '/api/workouts', headers: auth, payload: watch })
    assert.equal(reimport.json().needs_review, false)
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

  test('estimate is disabled without the LLM proxy', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/estimate', headers: auth,
      payload: { image: { media_type: 'image/jpeg', data: 'AAAA' } },
    })
    assert.equal(res.statusCode, 503)
  })

  test('estimate rejects an unsupported image type', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/estimate', headers: auth,
      payload: { image: { media_type: 'image/gif', data: 'AAAA' } },
    })
    assert.equal(res.statusCode, 400)
  })

  test('chat endpoint is disabled without the LLM proxy', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/chat', headers: auth,
      payload: { messages: [{ role: 'user', content: 'bugun 82 kilo' }] },
    })
    assert.equal(res.statusCode, 503)
  })

  test('chat rejects an empty message list', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/chat', headers: auth, payload: { messages: [] } })
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

describe('parseEstimate', () => {
  test('reads a clean JSON reply', () => {
    const value = parseEstimate('{"items":["tavuk"],"protein_g":42,"kcal":510,"confidence":"medium"}')
    assert.deepEqual(value, { items: ['tavuk'], protein_g: 42, kcal: 510, confidence: 'medium' })
  })

  test('tolerates fences and prose around the object', () => {
    const reply = ['Iste tahmin:', '```json', '{"items":[],"protein_g":0,"kcal":0,"confidence":"low"}', '```'].join(String.fromCharCode(10))
    const value = parseEstimate(reply)
    assert.equal((value as { kcal: number }).kcal, 0)
  })

  test('rejects a reply missing the numbers', () => {
    assert.equal(parseEstimate('{"items":["tavuk"],"confidence":"high"}'), null)
  })

  test('rejects a bad confidence value', () => {
    assert.equal(parseEstimate('{"items":[],"protein_g":1,"kcal":1,"confidence":"belki"}'), null)
  })

  test('rejects text with no object at all', () => {
    assert.equal(parseEstimate('bilmiyorum'), null)
  })
})

describe('splitReply', () => {
  test('separates the answer from the trailing record block', () => {
    const raw = ['Tamam, yazdım.', '<kayit>{"weight_kg":82.4,"summary":"Sabah 82.4 kg"}</kayit>'].join(String.fromCharCode(10))
    const { text, draft } = splitReply(raw)
    assert.equal(text, 'Tamam, yazdım.')
    assert.equal((draft as { weight_kg: number }).weight_kg, 82.4)
  })

  test('a plain answer has no draft', () => {
    const { text, draft } = splitReply('Tavukta 100 gramda yaklaşık 31 g protein var.')
    assert.equal(draft, null)
    assert.ok(text.length > 0)
  })

  test('a malformed record block does not lose the answer', () => {
    const { text, draft } = splitReply('Not aldım.<kayit>{bozuk}</kayit>')
    assert.equal(text, 'Not aldım.')
    assert.equal(draft, null)
  })

  test('a record without a summary is rejected', () => {
    assert.equal(splitReply('x<kayit>{"weight_kg":82}</kayit>').draft, null)
  })

  test('a non-numeric measurement is rejected', () => {
    assert.equal(splitReply('x<kayit>{"weight_kg":"seksen","summary":"..."}</kayit>').draft, null)
  })
})

describe('collectSources', () => {
  test('keeps the first mention of each url', () => {
    const sources = collectSources([
      { type: 'url_citation', url_citation: { url: 'https://a.example/x', title: 'A' } },
      { type: 'url_citation', url_citation: { url: 'https://a.example/x', title: 'A again' } },
      { type: 'url_citation', url_citation: { url: 'https://b.example/y', title: 'B' } },
    ])
    assert.deepEqual(sources, [
      { title: 'A', url: 'https://a.example/x' },
      { title: 'B', url: 'https://b.example/y' },
    ])
  })

  test('falls back to the host when a citation has no title', () => {
    const sources = collectSources([{ type: 'url_citation', url_citation: { url: 'https://www.example.com/p' } }])
    assert.deepEqual(sources, [{ title: 'example.com', url: 'https://www.example.com/p' }])
  })

  test('drops citations without a url, and handles none at all', () => {
    assert.deepEqual(collectSources([{ type: 'url_citation', url_citation: {} }]), [])
    assert.deepEqual(collectSources(undefined), [])
  })
})

describe('cors', { skip: databaseUrl ? false : 'DATABASE_URL not set' }, () => {
  let app: ReturnType<typeof buildServer>['app']
  let pool: ReturnType<typeof buildServer>['pool']

  before(async () => {
    const built = buildServer({ databaseUrl: databaseUrl as string, apiToken: TOKEN })
    app = built.app
    pool = built.pool
    await app.ready()
  })

  after(async () => { await app.close() })

  test('answers a preflight from the app origin without asking for a token', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/api/daily',
      headers: { origin: 'https://evatechnosoft.github.io', 'access-control-request-method': 'GET' },
    })
    assert.equal(res.statusCode, 204)
    assert.equal(res.headers['access-control-allow-origin'], 'https://evatechnosoft.github.io')
    assert.match(String(res.headers['access-control-allow-headers']), /authorization/)
  })

  test('sends no allow-origin to a page that is not on the list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://evil.example' },
    })
    assert.equal(res.headers['access-control-allow-origin'], undefined)
  })

  test('a preflight still does not let a real request through unauthenticated', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/daily',
      headers: { origin: 'https://evatechnosoft.github.io' },
    })
    assert.equal(res.statusCode, 401)
  })
})

describe('rate limit', { skip: databaseUrl ? false : 'DATABASE_URL not set' }, () => {
  let app: ReturnType<typeof buildServer>['app']
  let pool: ReturnType<typeof buildServer>['pool']

  before(async () => {
    const built = buildServer({ databaseUrl: databaseUrl as string, apiToken: TOKEN })
    app = built.app
    pool = built.pool
    await app.ready()
  })

  after(async () => { await app.close() })

  test('a flood of wrong tokens turns into 429 instead of endless 401', async () => {
    let last = 0
    let attempts = 0
    for (let i = 0; i < 40; i++) {
      const res = await app.inject({
        method: 'GET',
        url: '/api/daily',
        headers: { authorization: 'Bearer wrong' },
      })
      attempts++
      last = res.statusCode
      if (last === 429) break
    }
    assert.equal(last, 429)
    // Guessing dies long before the traffic window does.
    assert.ok(attempts <= 12, `gave up after ${attempts} tries`)
  })

  test('the right token does not get in while the guess window is spent', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/daily',
      headers: { authorization: `Bearer ${TOKEN}` },
    })
    assert.equal(res.statusCode, 429)
  })

  test('health stays open while the window is spent', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    assert.equal(res.statusCode, 200)
  })
})
