import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import fastifyStatic from '@fastify/static'

import { createPool, type Pool } from './db.ts'
import { registerEstimate } from './estimate.ts'
import { createLlm, type Llm } from './llm.ts'
import { registerChat } from './chat.ts'
import { registerRoutes } from './routes.ts'

/**
 * fit.evaitec.com serves the PWA and the API together, so the browser's own copy needs
 * no CORS at all. These are the callers that stay cross-origin: the APK's webview, the
 * Pages mirror, the Vite dev server. An allowlist rather than `*` -- the token travels
 * in a header and a stolen one should not be usable from any page a browser loads.
 */
const ALLOWED_ORIGINS = new Set([
  'https://evatechnosoft.github.io',
  // Capacitor's webview origins on Android.
  'https://localhost',
  'capacitor://localhost',
  // Vite dev server.
  'http://localhost:5173',
])

export interface BuildOptions {
  databaseUrl: string
  apiToken: string
  /** Optional: LiteLLM proxy. Without it the model-backed routes answer 503. */
  llm?: Llm | null
  logger?: boolean
  /** Optional: built PWA to serve from the same origin. Absent -> API only. */
  webDist?: string | null
  /** APK'larin durdugu dizin; /ota/ altinda herkese acik servis edilir (OTA indirme, token yok). */
  otaDir?: string | null
  /** Secici sayfasi (tools/secici). /plan/ altindan servis edilir; bos ise cizilmez. */
  planDir?: string | null
}

/**
 * Who to count for rate limiting. The tunnel shares the API's network namespace and
 * forwards to localhost, so `req.ip` is 127.0.0.1 for every remote caller -- one shared
 * bucket, and a stranger could spend Dean's guess window. Cloudflare overwrites
 * `cf-connecting-ip` on every request, so it is the only header worth trusting here;
 * `x-forwarded-for` is not, its leftmost entry is whatever the caller wrote.
 * ponytail: a LAN caller that skips the tunnel can still forge this and burn someone
 * else's bucket. The tunnel is the only remote path, so that stays theoretical.
 */
function clientKey(req: FastifyRequest): string {
  const forwarded = req.headers['cf-connecting-ip']
  return (typeof forwarded === 'string' && forwarded) || req.ip
}

export function buildServer(opts: BuildOptions): { app: FastifyInstance; pool: Pool } {
  const pool = createPool(opts.databaseUrl)
  // Photos are base64 in the body; the default 1 MB cap would reject them.
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 8 * 1024 * 1024 })

  // Runs before auth on purpose: a preflight carries no Authorization header, so
  // answering it with 401 would make the browser drop the real request that follows.
  app.addHook('onRequest', async (req, reply) => {
    const origin = req.headers.origin
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      reply.header('access-control-allow-origin', origin)
      reply.header('vary', 'origin')
      reply.header('access-control-allow-headers', 'authorization, content-type')
      reply.header('access-control-allow-methods', 'GET, POST, PUT, DELETE, OPTIONS')
      reply.header('access-control-max-age', '86400')
    }
    if (req.method === 'OPTIONS') return reply.code(204).send()
  })

  // The API is reachable from the internet through the tunnel, so neither traffic nor
  // guessing may run unbounded. Two fixed windows per client address: a generous one for
  // the phone, a tight one for wrong tokens -- guessing is what actually needs stopping,
  // and a legitimate client never spends it. The token stays the real gate.
  // ponytail: in-process counters, one API replica. Move to Redis if that changes.
  const hits = new Map<string, { count: number; windowStart: number }>()
  const misses = new Map<string, { count: number; windowStart: number }>()
  const WINDOW_MS = 60_000
  const MAX_PER_WINDOW = 300
  const MAX_FAILED_PER_WINDOW = 10

  /** Counts this address in `book` and answers whether it is still under `max`. */
  const underLimit = (
    book: Map<string, { count: number; windowStart: number }>,
    key: string,
    now: number,
    max: number,
  ): boolean => {
    const seen = book.get(key)
    if (!seen || now - seen.windowStart >= WINDOW_MS) {
      book.set(key, { count: 1, windowStart: now })
      return true
    }
    return ++seen.count <= max
  }

  // Single-user app: one static bearer token, no auth system. /health stays open.
  const webDist = opts.webDist ?? null
  const servesWeb = webDist !== null && existsSync(webDist)
  const otaDir = opts.otaDir ?? null
  const servesOta = otaDir !== null && existsSync(otaDir)
  const planDir = opts.planDir ?? null
  const servesPlan = planDir !== null && existsSync(planDir)

  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health') return
    // The PWA itself is public: it is a static shell and carries no data. The token
    // gates /api/*, which is where every byte about Dean actually lives.
    if (servesWeb && !req.url.startsWith('/api/')) return
    // APK indirme de acik: evaitecOTA katalogu buradan ceker, GitHub CDN bu agdan 120 KB/s.
    if (servesOta && req.url.startsWith('/ota/')) return
    // Secici sayfasi da acik: Dean'in verisini tasimaz, yalniz katalog ve kural motoru.
    if (servesPlan && req.url.startsWith('/plan')) return

    const now = Date.now()
    const key = clientKey(req)

    // A spent guess window keeps answering 429 even when the token is right: whoever is
    // hammering the door does not get to walk in mid-flood.
    const guessing = misses.get(key)
    const guessWindowSpent =
      guessing !== undefined &&
      now - guessing.windowStart < WINDOW_MS &&
      guessing.count > MAX_FAILED_PER_WINDOW
    if (guessWindowSpent || !underLimit(hits, key, now, MAX_PER_WINDOW)) {
      return reply.code(429).send({ error: 'too_many_requests' })
    }

    // Windows that rolled over are dead weight; drop them while we are here.
    if (hits.size > 1000) {
      for (const [k, v] of hits) if (now - v.windowStart >= WINDOW_MS) hits.delete(k)
      for (const [k, v] of misses) if (now - v.windowStart >= WINDOW_MS) misses.delete(k)
    }

    const header = req.headers.authorization
    if (header !== `Bearer ${opts.apiToken}`) {
      if (!underLimit(misses, key, now, MAX_FAILED_PER_WINDOW)) {
        return reply.code(429).send({ error: 'too_many_requests' })
      }
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })

  if (servesWeb) {
    // Same origin as /api: no CORS for the PWA, one hostname to remember, one token
    // that never travels cross-site. @fastify/static rather than hand-rolled file
    // reading -- path traversal and cache headers are not worth re-implementing.
    app.register(fastifyStatic, { root: webDist })
  }
  if (servesOta) {
    // list: fit.evaitec.com/ota/ acilinca eldeki APK'lar gorunsun (depo bu makine, Dean 20 Eyl).
    app.register(fastifyStatic, { root: otaDir, prefix: '/ota/', decorateReply: !servesWeb, list: { format: 'json', names: ['index', ''] } })
  }

  if (servesPlan) {
    // Yardimci dosyalar (plan.js, img/*) oldugu gibi; sayfanin KENDISI asagida sarmalanir.
    app.register(fastifyStatic, { root: planDir, prefix: '/plan/', decorateReply: false })

    // `secici.html` claude.ai artifact'i icin yazildi: orada doctype/html/head iskeletini
    // platform ekliyor, dosyanin kendisi <title> ile basliyor. Kendi sunucumuzda o iskelet
    // yok - charset'siz ve doctype'siz sayfa quirks mode'a dusuyordu. Tek kaynak bozulmasin
    // diye dosya degil, SERVIS sarmaliyor.
    const shell = (body: string): string =>
      '<!doctype html>\n<html lang="tr">\n<head>\n' +
      '<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<style>:root{color-scheme:light dark}body{margin:0;font:14px system-ui,sans-serif}' +
      'img{max-width:100%}[hidden]{display:none!important}</style>\n' +
      // Beyaz ekran yerine sebebi gorunsun: bir daha "acilmiyor" demek zorunda kalinmasin.
      '<script>window.onerror=function(m,f,l){var d=document.createElement("pre");' +
      'd.style.cssText="white-space:pre-wrap;padding:12px;margin:0;background:#3b0d0d;color:#ffd7d7;font:12px monospace";' +
      'd.textContent="Sayfa hatasi: "+m+"\\n"+(f||"")+":"+(l||"");' +
      '(document.body||document.documentElement).prepend(d);};</script>\n' +
      '</head>\n<body>\n' + body + '\n</body>\n</html>\n'

    const pageFile = join(planDir, 'secici.html')
    const secici = async (_req: FastifyRequest, reply: FastifyReply) => {
      const body = await readFile(pageFile, 'utf8')
      return reply.type('text/html; charset=utf-8').send(shell(body))
    }
    // Menudeki kisa adresler; secici.html dogrudan acilinca da iskeletsiz kalmasin.
    app.get('/plan/', secici)
    app.get('/plan/tabak', secici)
    app.get('/plan/secici.html', secici)
    // tatli.html kendi iskeletini tasir, oldugu gibi gider.
    app.get('/plan/tatli', async (_req, reply) =>
      reply.type('text/html; charset=utf-8').send(await readFile(join(planDir, 'tatli.html'), 'utf8')))
    // Sondaki egik cizgiyi unutan adres 404 olmasin.
    app.get('/plan', async (_req, reply) => reply.redirect('/plan/', 301))
  }

  registerRoutes(app, pool)
  const llm = opts.llm ?? null
  registerEstimate(app, llm)
  registerChat(app, llm)
  app.addHook('onClose', async () => { await pool.end() })
  return { app, pool }
}

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}
