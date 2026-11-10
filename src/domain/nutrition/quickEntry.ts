import { QUICK_FOOD_ID, isQuickFoodId } from '../foods/foodIds'
import type { IsoDate, LogEntry, Meal } from '../types'
import { MAX_ENTRY_GRAMS } from './nutrition'

export const QUICK_ENTRY_NAME = 'Snabbregistrering'

/** Största antal kalorier i en snabbregistrering, samma gräns som för en vanlig post. */
export const MAX_QUICK_KCAL = MAX_ENTRY_GRAMS

export function isValidQuickKcal(kcal: number | null): kcal is number {
  return kcal !== null && Number.isFinite(kcal) && kcal > 0 && kcal <= MAX_QUICK_KCAL
}

/**
 * En snabbregistrering sparas som en vanlig loggpost med 100 kcal per 100 g, så
 * att antal gram är lika med antal kalorier. Då räknas den ihop med övriga poster
 * utan särfall och går att exportera och importera i det befintliga formatet.
 * Protein, kolhydrater och fett är noll.
 */
export function quickEntryInput(date: IsoDate, meal: Meal, kcal: number, name?: string): Omit<LogEntry, 'id' | 'createdAt'> {
  return {
    date,
    meal,
    foodId: QUICK_FOOD_ID,
    foodName: name?.trim() || QUICK_ENTRY_NAME,
    grams: kcal,
    per100g: { kcal: 100, protein: 0, carbs: 0, fat: 0 },
  }
}

export function isQuickEntry(entry: Pick<LogEntry, 'foodId'>): boolean {
  return isQuickFoodId(entry.foodId)
}

/** Antal kalorier i en snabbregistrering. */
export function quickEntryKcal(entry: Pick<LogEntry, 'grams'>): number {
  return entry.grams
}
