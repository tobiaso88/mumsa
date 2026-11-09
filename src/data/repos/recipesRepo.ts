import { recipeFoodId } from '../../domain/foods/foodIds'
import type { Recipe } from '../../domain/types'
import { newId, type MumsaDb } from '../db/db'

export type RecipeInput = Omit<Recipe, 'id' | 'updatedAt'>

export function getRecipe(db: MumsaDb, id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

export async function getRecipes(db: MumsaDb, ids: readonly string[]): Promise<Recipe[]> {
  const recipes = await db.recipes.bulkGet([...ids])
  return recipes.filter((r): r is Recipe => r !== undefined)
}

export function listRecipes(db: MumsaDb): Promise<Recipe[]> {
  return db.recipes.orderBy('name').toArray()
}

export async function createRecipe(db: MumsaDb, input: RecipeInput, now = new Date()): Promise<Recipe> {
  const recipe: Recipe = { ...input, id: recipeFoodId(newId()), updatedAt: now.toISOString() }
  await db.recipes.add(recipe)
  return recipe
}

export async function updateRecipe(db: MumsaDb, id: string, input: RecipeInput, now = new Date()): Promise<Recipe> {
  if (!(await db.recipes.get(id))) throw new Error('Receptet finns inte.')
  const recipe: Recipe = { ...input, id, updatedAt: now.toISOString() }
  await db.recipes.put(recipe)
  return recipe
}

/** Loggposter påverkas inte eftersom de har en egen kopia av näringen. */
export async function deleteRecipe(db: MumsaDb, id: string): Promise<void> {
  await db.recipes.delete(id)
}
