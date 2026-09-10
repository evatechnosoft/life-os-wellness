import Fastify, { type FastifyInstance } from 'fastify'

import { createPool, type Pool } from './db.ts'
import { registerEstimate } from './estimate.ts'
import { registerRoutes } from './routes.ts'

export interface BuildOptions {
  databaseUrl: string
  apiToken: string
  /** Optional: enables POST /api/estimate (meal photo -> protein/kcal guess). */
  anthropicApiKey?: string
  logger?: boolean
}

export function buildServer(opts: BuildOptions): { app: FastifyInstance; pool: Pool } {
  const pool = createPool(opts.databaseUrl)
  // Photos are base64 in the body; the default 1 MB cap would reject them.
  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 8 * 1024 * 1024 })

  // Single-user app: one static bearer token, no auth system. /health stays open.
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health') return
    const header = req.headers.authorization
    if (header !== `Bearer ${opts.apiToken}`) {
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })

  registerRoutes(app, pool)
  registerEstimate(app, opts.anthropicApiKey)
  app.addHook('onClose', async () => { await pool.end() })
  return { app, pool }
}

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}
