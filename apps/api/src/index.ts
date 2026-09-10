import { buildServer, requiredEnv } from './server.ts'

const { app } = buildServer({
  databaseUrl: requiredEnv('DATABASE_URL'),
  apiToken: requiredEnv('API_TOKEN'),
  logger: true,
})

const port = Number(process.env.API_PORT ?? 3001)
await app.listen({ port, host: '0.0.0.0' })
