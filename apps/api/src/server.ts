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

  // The API is reachable from the internet through the tunnel, so a wrong token must
  // not be retryable without limit. Fixed window per client address; the token itself
  // is the real gate, this only stops a flood.
  // ponytail: in-process counter, one API replica. Move to Redis if that changes.
  const hits = new Map<string, { count: number; windowStart: number }>()
  const WINDOW_MS = 60_000
  const MAX_PER_WINDOW = 120

  // Single-user app: one static bearer token, no auth system. /health stays open.
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health') return

    const now = Date.now()
    const key = req.ip
    const seen = hits.get(key)
    if (!seen || now - seen.windowStart >= WINDOW_MS) {
      hits.set(key, { count: 1, windowStart: now })
    } else if (++seen.count > MAX_PER_WINDOW) {
      return reply.code(429).send({ error: 'too_many_requests' })
    }
    // Windows that rolled over are dead weight; drop them while we are here.
    if (hits.size > 1000) {
      for (const [k, v] of hits) if (now - v.windowStart >= WINDOW_MS) hits.delete(k)
    }

    const header = req.headers.authorization
    if (header !== `Bearer ${opts.apiToken}`) {
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
