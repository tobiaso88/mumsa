import { MAX_TEXT_LENGTH } from '../foods/foodValidation'
import { isValidAmount, nutrientsForAmount, scaleNutrients, sumNutrients } from '../nutrition/nutrition'
import type { Food, Nutrients, Recipe } from '../types'

/** Fler portioner än så är troligen ett skrivfel. */
export const MAX_SERVINGS = 100
export const MAX_INGREDIENTS = 100

export function isValidServings(servings: number | null): servings is number {
  return servings !== null && Number.isFinite(servings) && servings > 0 && servings <= MAX_SERVINGS
}

/** Summan av ingrediensernas vikt i gram. */
export function recipeGrams(recipe: Pick<Recipe, 'ingredients'>): number {
  return recipe.ingredients.reduce((sum, i) => sum + i.grams, 0)
}

/** Näring för hela receptet. */
export function recipeNutrients(recipe: Pick<Recipe, 'ingredients'>): Nutrients {
  return sumNutrients(recipe.ingredients.map((i) => nutrientsForAmount(i.per100g, i.grams)))
}

/** Näring för en portion, eller null om antalet portioner är ogiltigt. */
export function recipeNutrientsPerServing(recipe: Pick<Recipe, 'ingredients' | 'servings'>): Nutrients | null {
  return isValidServings(recipe.servings) ? scaleNutrients(recipeNutrients(recipe), 1 / recipe.servings) : null
}

/** Vikten för en portion i gram, eller null om antalet portioner är ogiltigt. */
export function recipeServingGrams(recipe: Pick<Recipe, 'ingredients' | 'servings'>): number | null {
  return isValidServings(recipe.servings) ? recipeGrams(recipe) / recipe.servings : null
}

/**
 * Sant om receptet går att spara och logga: ett namn, minst en ingrediens
 * med giltig mängd, ett giltigt antal portioner och en portion som ryms i en loggpost.
 */
export function isValidRecipe(recipe: Pick<Recipe, 'name' | 'servings' | 'ingredients'>): boolean {
  const serving = recipeServingGrams(recipe)
  return (
    recipe.name.trim() !== '' &&
    recipe.name.length <= MAX_TEXT_LENGTH &&
    recipe.ingredients.length > 0 &&
    recipe.ingredients.length <= MAX_INGREDIENTS &&
    recipe.ingredients.every((i) => isValidAmount(i.grams)) &&
    serving !== null &&
    isValidAmount(serving)
  )
}

/**
 * Receptet som ett livsmedel, så att det kan sökas och loggas som alla andra.
 * Näringen per 100 g räknas på ingrediensernas sammanlagda vikt, och en portion
 * är totalvikten delad på antalet portioner. Ger null för ett recept utan vikt.
 */
export function recipeToFood(recipe: Recipe): Food | null {
  const grams = recipeGrams(recipe)
  const servingGrams = recipeServingGrams(recipe)
  if (grams <= 0 || servingGrams === null) return null
  return {
    id: recipe.id,
    name: recipe.name,
    source: 'recipe',
    per100g: nutrientsForAmount(recipeNutrients(recipe), 10_000 / grams),
    servingGrams,
    updatedAt: recipe.updatedAt,
  }
}
