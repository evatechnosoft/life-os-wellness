/** Local calendar date as YYYY-MM-DD. Never use toISOString() here: it is UTC and shifts the day. */
export function toLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Inclusive list of the `count` local dates ending on `end`. */
export function lastDates(count: number, end: Date = new Date()): string[] {
  const dates: string[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i)
    dates.push(toLocalDate(d))
  }
  return dates
}

/**
 * Whole local days from `from` to `to`, both YYYY-MM-DD. Rounding keeps the
 * count whole across a DST change, where the raw difference is off by an hour.
 */
export function daysBetween(from: string, to: string): number {
  const at = (date: string): number => {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(year!, month! - 1, day!).getTime()
  }
  return Math.round((at(to) - at(from)) / 86400000)
}
