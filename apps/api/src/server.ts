import Fastify, { type FastifyInstance } from 'fastify'

import { createPool, type Pool } from './db.ts'
import { registerRoutes } from './routes.ts'

export interface BuildOptions {
  databaseUrl: string
  apiToken: string
  logger?: boolean
}

export function buildServer(opts: BuildOptions): { app: FastifyInstance; pool: Pool } {
  const pool = createPool(opts.databaseUrl)
  const app = Fastify({ logger: opts.logger ?? false })

  // Single-user app: one static bearer token, no auth system. /health stays open.
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health') return
    const header = req.headers.authorization
    if (header !== `Bearer ${opts.apiToken}`) {
      return reply.code(401).send({ error: 'unauthorized' })
    }
  })

  registerRoutes(app, pool)
  app.addHook('onClose', async () => { await pool.end() })
  return { app, pool }
}

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}
