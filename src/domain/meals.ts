import type { Meal } from './types'

/** Vilken måltid som ligger närmast till hands vid en given timme (0–23). */
export function defaultMealForHour(hour: number): Meal {
  if (hour >= 5 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 14) return 'lunch'
  if (hour >= 17 && hour < 21) return 'dinner'
  return 'snack'
}
