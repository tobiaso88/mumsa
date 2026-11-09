import { useState } from 'react'
import type { RecipeInput } from '../../data/repos/recipesRepo'
import { isValidAmount } from '../../domain/nutrition/nutrition'
import {
  isValidRecipe,
  isValidServings,
  MAX_INGREDIENTS,
  recipeGrams,
  recipeNutrientsPerServing,
  recipeServingGrams,
} from '../../domain/recipes/recipes'
import type { Food, Nutrients, Recipe } from '../../domain/types'
import { parseNumber, toInputText } from '../format'
import { entryName } from '../labels'

/** En ingrediens i formuläret. Mängden är text medan användaren skriver. */
export type IngredientField = {
  key: string
  foodId: string
  foodName: string
  per100g: Nutrients
  grams: string
}

const toField = (i: Recipe['ingredients'][number]): IngredientField => ({
  key: crypto.randomUUID(),
  foodId: i.foodId,
  foodName: i.foodName,
  per100g: i.per100g,
  grams: toInputText(i.grams),
})

/** Formulärstate för ett recept. Ger input till recipesRepo när allt är giltigt. */
export function useRecipeForm(initial?: Recipe) {
  const [name, setName] = useState(initial?.name ?? '')
  const [servings, setServings] = useState(toInputText(initial?.servings ?? 1))
  const [ingredients, setIngredients] = useState<IngredientField[]>(() => initial?.ingredients.map(toField) ?? [])

  const addIngredient = (food: Food, grams: number) =>
    setIngredients((list) => [
      ...list,
      { key: crypto.randomUUID(), foodId: food.id, foodName: entryName(food), per100g: food.per100g, grams: toInputText(grams) },
    ])
  const setGrams = (key: string, grams: string) => setIngredients((list) => list.map((i) => (i.key === key ? { ...i, grams } : i)))
  const removeIngredient = (key: string) => setIngredients((list) => list.filter((i) => i.key !== key))

  const parsed = ingredients.map((i) => ({ foodId: i.foodId, foodName: i.foodName, per100g: i.per100g, grams: parseNumber(i.grams) }))
  const servingCount = parseNumber(servings)
  const draft = { name, servings: servingCount, ingredients: parsed }
  const gramsValid = (grams: string) => isValidAmount(parseNumber(grams))
  const allGramsValid = ingredients.every((i) => gramsValid(i.grams))
  const valid = allGramsValid && isValidRecipe(draft)

  const input: RecipeInput | null = valid ? { name: name.trim(), servings: servingCount, ingredients: parsed } : null
  // Summeringen visas så fort alla mängder är giltiga, även om receptet ännu saknar namn
  const summarizable = ingredients.length > 0 && allGramsValid && isValidServings(servingCount)

  return {
    name,
    setName,
    servings,
    setServings,
    servingsValid: isValidServings(servingCount),
    ingredients,
    gramsValid,
    addIngredient,
    setGrams,
    removeIngredient,
    canAddIngredient: ingredients.length < MAX_INGREDIENTS,
    totalGrams: summarizable ? recipeGrams(draft) : null,
    servingGrams: summarizable ? recipeServingGrams(draft) : null,
    perServing: summarizable ? recipeNutrientsPerServing(draft) : null,
    input,
  }
}
