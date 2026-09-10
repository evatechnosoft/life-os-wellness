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

  // Single-user app: one static bearer token, no auth system. /health stays open.
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health') return
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
