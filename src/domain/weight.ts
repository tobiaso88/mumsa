import { addDays, daysBetween } from './dates'
import type { IsoDate, WeightEntry } from './types'

/** Gränser för att fånga skrivfel. Samma som för vikten i profilen. */
export function isValidWeightKg(kg: number): boolean {
  return Number.isFinite(kg) && kg > 0 && kg < 500
}

export function sortByDate(entries: readonly WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date))
}

export type WeightProgress = {
  start: WeightEntry
  latest: WeightEntry
  /** Förändring sedan första vägningen. Negativ om vikten har gått ner. */
  changeKg: number
  /** Målvikt minus senaste vikt, null utan målvikt. Negativ om vikten ska ner. */
  leftKg: number | null
  /** Om senaste vikten har nått målvikten i riktningen från första vägningen, null utan målvikt. */
  reached: boolean | null
}

/** Läget mot målvikten. null om inget är vägt. */
export function weightProgress(entries: readonly WeightEntry[], targetKg?: number): WeightProgress | null {
  const sorted = sortByDate(entries)
  const start = sorted[0]
  const latest = sorted[sorted.length - 1]
  if (!start || !latest) return null
  const changeKg = latest.kg - start.kg
  if (targetKg === undefined) return { start, latest, changeKg, leftKg: null, reached: null }
  const leftKg = targetKg - latest.kg
  const direction = Math.sign(targetKg - start.kg)
  const reached = direction === 0 ? leftKg === 0 : Math.sign(leftKg) !== direction
  return { start, latest, changeKg, leftKg, reached }
}

/**
 * Genomsnittlig förändring i kg per vecka mellan första och sista vägningen
 * under de senaste veckorna fram till today. null om vägningarna ligger
 * mindre än en vecka isär.
 */
export function weeklyChange(entries: readonly WeightEntry[], today: IsoDate, weeks = 4): number | null {
  const recent = weightsInRange(entries, addDays(today, -weeks * 7), today)
  const first = recent[0]
  const last = recent[recent.length - 1]
  if (!first || !last) return null
  const days = daysBetween(first.date, last.date)
  return days < 7 ? null : ((last.kg - first.kg) / days) * 7
}

/** Vägningar från och med from till och med to, äldst först. */
export function weightsInRange(entries: readonly WeightEntry[], from: IsoDate, to: IsoDate): WeightEntry[] {
  return sortByDate(entries.filter((e) => e.date >= from && e.date <= to))
}
