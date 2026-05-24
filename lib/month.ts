// Centralized month/date helpers.
// All math uses local (IST-equivalent server) dates and never hardcodes "30/31".

export function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

// First / last day strings for a (year, month). month is 1-12.
export function monthFirstDay(year: number, month: number): string {
  return `${year}-${pad2(month)}-01`
}

export function monthLastDay(year: number, month: number): string {
  // Day 0 of the next month == last day of the requested month.
  const d = new Date(year, month, 0)
  return ymd(d)
}

// Number of calendar days in a given (year, month).
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// Year/month tuple for "today".
export function currentMonthRange() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  return {
    year,
    month,
    days:  daysInMonth(year, month),
    start: monthFirstDay(year, month),
    end:   monthLastDay(year, month),
    today: todayIso(),
  }
}

// Days that fall inside [from..to] for the given (year, month).
// from/to may be outside the month — the result is always clamped to the month.
export function billableDays(
  year: number,
  month: number,
  from: string,        // subscription start_date (yyyy-mm-dd)
  to?: string | null,  // subscription end_date  (yyyy-mm-dd) or null
): number {
  const monthStart = monthFirstDay(year, month)
  const monthEnd   = monthLastDay(year, month)
  const lo = from > monthStart ? from : monthStart
  const hi = to && to < monthEnd ? to : monthEnd
  if (lo > hi) return 0
  const a = new Date(`${lo}T00:00:00`)
  const b = new Date(`${hi}T00:00:00`)
  // inclusive day count
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1
}

// Build an array of yyyy-mm-dd strings for [from..to] inclusive.
export function enumerateDays(from: string, to: string): string[] {
  if (from > to) return []
  const out: string[] = []
  const start = new Date(`${from}T00:00:00`)
  const end   = new Date(`${to}T00:00:00`)
  const cursor = new Date(start)
  while (cursor.getTime() <= end.getTime()) {
    out.push(ymd(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}
