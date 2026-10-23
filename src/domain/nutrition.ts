import type { Food, LogEntry, Nutrients } from './types'

export const ZERO_NUTRIENTS: Readonly<Nutrients> = Object.freeze({
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
})

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  }
}

export function sumNutrients(list: readonly Nutrients[]): Nutrients {
  return list.reduce<Nutrients>(addNutrients, { ...ZERO_NUTRIENTS })
}

export function scaleNutrients(n: Nutrients, factor: number): Nutrients {
  return {
    kcal: n.kcal * factor,
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    fat: n.fat * factor,
  }
}

/** Näring för en given mängd, utifrån värden per 100 g. */
export function nutrientsForAmount(per100g: Nutrients, grams: number): Nutrients {
  return scaleNutrients(per100g, grams / 100)
}

/** Antal portioner omräknat till gram, eller null om livsmedlet saknar portionsstorlek. */
export function portionsToGrams(food: Pick<Food, 'servingGrams'>, portions: number): number | null {
  if (food.servingGrams === undefined || food.servingGrams <= 0) return null
  return food.servingGrams * portions
}

export function entryNutrients(entry: Pick<LogEntry, 'per100g' | 'grams'>): Nutrients {
  return nutrientsForAmount(entry.per100g, entry.grams)
}
