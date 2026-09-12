import Fastify, { type FastifyInstance } from 'fastify'

import { createPool, type Pool } from './db.ts'
import { registerEstimate } from './estimate.ts'
import { createLlm, type Llm } from './llm.ts'
import { registerChat } from './chat.ts'
import { registerRoutes } from './routes.ts'

/**
 * The app is served from somewhere else than the API (Pages, or the APK's webview), so
 * every call is cross-origin. An allowlist rather than `*`: the token travels in a header
 * and a stolen one should not be usable from any page a browser happens to load.
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
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health') return

    const now = Date.now()
    const key = req.ip

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
