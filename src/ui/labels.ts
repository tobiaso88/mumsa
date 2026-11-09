import type { Food, Meal } from '../domain/types'
import type { IconName } from './components/Icon'

export const MEAL_LABELS: Record<Meal, string> = {
  breakfast: 'Frukost',
  lunch: 'Lunch',
  dinner: 'Middag',
  snack: 'Mellanmål',
}

export const SOURCE_LABELS: Record<Food['source'], string> = {
  custom: 'Eget',
  slv: 'Livsmedelsverket',
  off: 'Skannad',
}

export const MEAL_ICONS: Record<Meal, IconName> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snack',
}

/** Namnet som sparas på en loggpost, med varumärke om det finns. */
export function entryName(food: Pick<Food, 'name' | 'brand'>): string {
  return food.brand ? `${food.name}, ${food.brand}` : food.name
}
