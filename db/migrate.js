// Applies db/*.sql in filename order, once each, tracked in schema_migrations.
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))
const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set (copy .env.example to .env)')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()
await client.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())')

const files = (await readdir(here)).filter((f) => f.endsWith('.sql')).sort()
const { rows } = await client.query('select name from schema_migrations')
const applied = new Set(rows.map((r) => r.name))

for (const file of files) {
  if (applied.has(file)) continue
  const sql = await readFile(join(here, file), 'utf8')
  await client.query('begin')
  try {
    await client.query(sql)
    await client.query('insert into schema_migrations (name) values ($1)', [file])
    await client.query('commit')
    console.log(`applied ${file}`)
  } catch (err) {
    await client.query('rollback')
    throw err
  }
}

await client.end()
console.log('migrations up to date')
