import { parseIsoDate } from '../domain/dates'
import type { IsoDate } from '../domain/types'

/** Tolkar inmatade tal med decimalkomma eller decimalpunkt. Ger NaN för tom eller ogiltig text. */
export function parseNumber(text: string): number {
  const trimmed = text.trim().replace(',', '.')
  return trimmed === '' ? NaN : Number(trimmed)
}

/** Avrundar för visning. Allt avrundas här i UI:t, aldrig i domain/. */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('sv-SE', { maximumFractionDigits: decimals, minimumFractionDigits: 0 })
}

/** Sparat tal som text i ett inmatningsfält, med decimalkomma. */
export function toInputText(value: number | undefined): string {
  return value === undefined ? '' : String(value).replace('.', ',')
}

/** T.ex. "fredag 23 oktober". */
export function formatDayTitle(date: IsoDate): string {
  return parseIsoDate(date).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** T.ex. "19 okt". */
export function formatShortDate(date: IsoDate): string {
  return parseIsoDate(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }).replace('.', '')
}

/** T.ex. "mån". */
export function formatWeekdayShort(date: IsoDate): string {
  return parseIsoDate(date).toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '')
}
