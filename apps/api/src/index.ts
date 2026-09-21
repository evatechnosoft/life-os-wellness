import { createLlm } from './llm.ts'
import { buildServer, requiredEnv } from './server.ts'

const { app } = buildServer({
  databaseUrl: requiredEnv('DATABASE_URL'),
  apiToken: requiredEnv('API_TOKEN'),
  llm: createLlm(),
  logger: true,
  // Set in the image; unset when running the API alone next to `vite dev`.
  webDist: process.env.WEB_DIST ?? null,
  otaDir: process.env.OTA_DIR ?? null,
  planDir: process.env.PLAN_DIR ?? null,
})

const port = Number(process.env.API_PORT ?? 3001)
await app.listen({ port, host: '0.0.0.0' })
