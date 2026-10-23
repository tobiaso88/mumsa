import type { Food, Meal } from '../domain/types'

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Frukost',
  lunch: 'Lunch',
  dinner: 'Middag',
  snack: 'Mellanmål',
}

/** Namnet som sparas på en loggpost, med varumärke om det finns. */
export function entryName(food: Pick<Food, 'name' | 'brand'>): string {
  return food.brand ? `${food.name}, ${food.brand}` : food.name
}
