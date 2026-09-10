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
