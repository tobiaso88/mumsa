import type { ActivityLevel, Food, Meal, ObjectiveKind, Pace, Sex } from '../domain/types'
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

export const OBJECTIVE_LABELS: Record<ObjectiveKind, string> = {
  lose: 'Gå ner i vikt',
  maintain: 'Behålla vikten',
  gain: 'Gå upp i vikt',
  build_muscle: 'Bygga muskler',
}

export const PACE_LABELS: Record<Pace, string> = { slow: 'Lugn', moderate: 'Måttlig' }

export const SEX_LABELS: Record<Sex, string> = { female: 'Kvinna', male: 'Man' }

/** Utförliga nivåer för formuläret. */
export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Stillasittande, lite eller ingen träning',
  light: 'Lätt aktiv, träning 1–3 dagar i veckan',
  moderate: 'Måttligt aktiv, träning 3–5 dagar i veckan',
  active: 'Mycket aktiv, träning 6–7 dagar i veckan',
  very_active: 'Extremt aktiv, fysiskt arbete och träning',
}

/** Korta nivåer för sammanfattningen på profilen. */
export const ACTIVITY_SHORT_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Stillasittande',
  light: 'Lätt aktiv',
  moderate: 'Måttlig',
  active: 'Mycket aktiv',
  very_active: 'Extremt aktiv',
}
