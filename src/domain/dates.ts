import type { IsoDate } from './types'

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function toIsoDate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string') return false
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Tolkar ett IsoDate som lokal midnatt. */
export function parseIsoDate(value: IsoDate): Date {
  if (!isIsoDate(value)) throw new Error(`Ogiltigt datum: ${value}`)
  const [y, m, d] = value.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

/** Måndagen i samma vecka. */
export function startOfWeek(value: IsoDate): IsoDate {
  const weekday = parseIsoDate(value).getDay()
  const daysSinceMonday = (weekday + 6) % 7
  return addDays(value, -daysSinceMonday)
}

/** De sju datumen måndag–söndag i veckan som börjar på weekStart. */
export function weekDates(weekStart: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}
