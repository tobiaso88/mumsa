/** Datum i lokal tid på formen YYYY-MM-DD. */
export type IsoDate = string

/** Energi i kcal, makronäringsämnen i gram. */
export type Nutrients = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** off: Open Food Facts, slv: Livsmedelsverket (buntad), custom: eget. */
export type FoodSource = 'off' | 'slv' | 'custom'

export type Food = {
  id: string
  name: string
  brand?: string
  barcode?: string
  source: FoodSource
  per100g: Nutrients
  /** Vikt för en portion i gram, om livsmedlet har en portionsstorlek. */
  servingGrams?: number
  servingLabel?: string
  updatedAt: string
}

export const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type Meal = (typeof MEALS)[number]

/**
 * En loggad mängd av ett livsmedel. Namn och näring sparas som ögonblicksbild
 * så att historiken inte ändras om livsmedlet redigeras eller tas bort.
 */
export type LogEntry = {
  id: string
  date: IsoDate
  meal: Meal
  foodId: string
  foodName: string
  grams: number
  per100g: Nutrients
  createdAt: string
}

/** Andel av energin i procent. Ska summera till 100. */
export type MacroSplit = {
  proteinPct: number
  carbsPct: number
  fatPct: number
}

export type Goals = {
  kcal: number
  split: MacroSplit
}

export type Sex = 'female' | 'male'

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export type Profile = {
  weightKg: number
  heightCm: number
  ageYears: number
  sex: Sex
  activity: ActivityLevel
}
