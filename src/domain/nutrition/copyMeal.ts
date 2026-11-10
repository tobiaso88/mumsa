import type { IsoDate, LogEntry, Meal, Nutrients } from '../types'
import { entryNutrients, sumNutrients } from './nutrition'

/** Det som behövs för att skapa en ny loggpost, utan id och tidpunkt. */
export type NewLogEntry = Omit<LogEntry, 'id' | 'createdAt'>

/** En tidigare dag där en måltid har loggade poster. */
export type MealDay = { date: IsoDate; entries: LogEntry[]; total: Nutrients }

/**
 * Dagar med poster i måltiden meal, senaste dagen först. Posterna ligger i den
 * ordning de loggades. Dagar utan poster i måltiden hoppas över.
 */
export function mealDays(entries: readonly LogEntry[], meal: Meal): MealDay[] {
  const byDate = new Map<IsoDate, LogEntry[]>()
  for (const entry of entries) {
    if (entry.meal !== meal) continue
    byDate.set(entry.date, [...(byDate.get(entry.date) ?? []), entry])
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => {
      const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return { date, entries: sorted, total: sumNutrients(sorted.map(entryNutrients)) }
    })
}

/**
 * Poster att lägga till när en måltid kopieras. Namn, mängd och näring följer
 * med som de var loggade, så att kopian ser ut som originalet.
 */
export function copiedEntries(source: readonly LogEntry[], target: { date: IsoDate; meal: Meal }): NewLogEntry[] {
  return source.map(({ foodId, foodName, grams, per100g }) => ({
    date: target.date,
    meal: target.meal,
    foodId,
    foodName,
    grams,
    per100g: { ...per100g },
  }))
}
