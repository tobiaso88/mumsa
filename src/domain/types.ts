/** Datum i lokal tid på formen YYYY-MM-DD. */
export type IsoDate = string

/** Energi i kcal, makronäringsämnen i gram. */
export type Nutrients = {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** off: Open Food Facts, slv: Livsmedelsverket (buntad), custom: eget, recipe: härlett från ett recept. */
export const FOOD_SOURCES = ['off', 'slv', 'custom', 'recipe'] as const
export type FoodSource = (typeof FOOD_SOURCES)[number]

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

/** En ingrediens i ett recept. Namn och näring är en ögonblicksbild, som i en loggpost. */
export type RecipeIngredient = {
  foodId: string
  foodName: string
  grams: number
  per100g: Nutrients
}

/** Ett eget recept. Id:t är samtidigt id för det livsmedel receptet loggas som. */
export type Recipe = {
  id: string
  name: string
  /** Antal portioner receptet ger. Kan vara ett decimaltal, t.ex. 2,5. */
  servings: number
  ingredients: RecipeIngredient[]
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

export const OBJECTIVE_KINDS = ['lose', 'maintain', 'gain', 'build_muscle'] as const
export type ObjectiveKind = (typeof OBJECTIVE_KINDS)[number]

/** Takt för viktförändring. slow ungefär 0,25 kg per vecka, moderate ungefär 0,5 kg. */
export const PACES = ['slow', 'moderate'] as const
export type Pace = (typeof PACES)[number]

/** Vad användaren vill uppnå. Att behålla vikten har ingen takt. */
export type Objective = { kind: 'maintain' } | { kind: Exclude<ObjectiveKind, 'maintain'>; pace: Pace }

export type Goals = {
  kcal: number
  split: MacroSplit
  /** Saknas i data från äldre versioner och tolkas då som att behålla vikten. */
  objective?: Objective
  targetWeightKg?: number
}

/** En vägning. Högst en per dag, så datumet är nyckeln. */
export type WeightEntry = {
  date: IsoDate
  kg: number
  createdAt: string
}

export const SEXES = ['female', 'male'] as const
export type Sex = (typeof SEXES)[number]

export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export type Profile = {
  weightKg: number
  heightCm: number
  ageYears: number
  sex: Sex
  activity: ActivityLevel
}
