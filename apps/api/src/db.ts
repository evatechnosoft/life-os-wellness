import pg from 'pg'

// Return dates as plain YYYY-MM-DD strings, not JS Date (which shifts across timezones).
pg.types.setTypeParser(1082, (value: string) => value)
// numeric -> number; all our numerics are small and safe in float64.
pg.types.setTypeParser(1700, (value: string) => Number(value))

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 5 })
}

export type Pool = pg.Pool
