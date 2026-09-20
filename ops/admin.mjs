// Admin kanali: ajan (Claude) telefona dokunmadan sunucuya yazar, telefon acilinca ceker.
//
//   node ops/admin.mjs goals protein_g=180 weekly_loss_pct=0.6
//   node ops/admin.mjs daily 2026-09-20 weight_kg=107.4 protein_g=170
//   node ops/admin.mjs profile height_cm=175 conditions='["tansiyon izlemi"]'
//   node ops/admin.mjs get goals|profile|split
//
// Token ve port .env'den (--env-file). Deger: sayi -> number, [ / { ile baslayan -> JSON,
// null -> null, digeri string. Hedef ve profil sunucuda birlestirilir (jsonb ||, upsert).
const [cmd, ...rest] = process.argv.slice(2)
const base = `http://localhost:${process.env.API_PORT ?? 3011}`
const token = process.env.API_TOKEN
if (!token) throw new Error('API_TOKEN yok: node --env-file=.env ops/admin.mjs ...')

export function parseArgs(pairs) {
  const body = {}
  for (const pair of pairs) {
    const at = pair.indexOf('=')
    if (at < 1) throw new Error(`anahtar=deger bekleniyor: ${pair}`)
    const key = pair.slice(0, at)
    const raw = pair.slice(at + 1)
    body[key] =
      raw === 'null' ? null
      : /^[\[{]/.test(raw) ? JSON.parse(raw)
      : raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw)
      : raw
  }
  return body
}

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`)
  return text
}

const ROUTES = { goals: '/api/goals', profile: '/api/profile', split: '/api/split' }
let out
if (cmd === 'get') out = await call('GET', ROUTES[rest[0]] ?? `/api/${rest[0]}`)
else if (cmd === 'daily') out = await call('PUT', `/api/daily/${rest[0]}`, parseArgs(rest.slice(1)))
else if (cmd in ROUTES) out = await call('PUT', ROUTES[cmd], parseArgs(rest))
else throw new Error('komut: get | goals | profile | daily <tarih> | split')
console.log(out)
