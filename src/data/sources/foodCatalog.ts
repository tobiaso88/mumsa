import { isRecipeFoodId, isSlvFoodId } from '../../domain/foods/foodIds'
import { searchFoods } from '../../domain/foods/search'
import { recipeToFood } from '../../domain/recipes/recipes'
import type { Food, Recipe } from '../../domain/types'
import type { MumsaDb } from '../db/db'
import { cacheOffFoods, findByBarcode, getFood, getFoods } from '../repos/foodsRepo'
import { getRecipe, getRecipes, listRecipes } from '../repos/recipesRepo'
import { loadSlvFoods } from './livsmedelsverket'
import { getByBarcode } from './openFoodFacts'

/**
 * Söker bland alla livsmedel som finns utan nätverk: egna, egna recept,
 * sparade från Open Food Facts och Livsmedelsverkets buntade databas.
 */
export async function searchAllFoods(db: MumsaDb, query: string, limit = 30): Promise<Food[]> {
  const [stored, recipes, slv] = await Promise.all([db.foods.toArray(), recipeFoods(db), loadSlvFoods()])
  return searchFoods([...stored, ...recipes, ...slv], query, limit)
}

/** Alla recept som livsmedel, sorterade på namn. Recept utan vikt hoppas över. */
export async function recipeFoods(db: MumsaDb): Promise<Food[]> {
  return toFoods(await listRecipes(db))
}

function toFoods(recipes: readonly Recipe[]): Food[] {
  return recipes.map(recipeToFood).filter((f): f is Food => f !== null)
}

/** Slår upp ett livsmedel oavsett om det ligger i databasen, är ett recept eller är buntat. */
export async function findFood(db: MumsaDb, id: string): Promise<Food | undefined> {
  if (isRecipeFoodId(id)) {
    const recipe = await getRecipe(db, id)
    return recipe ? (recipeToFood(recipe) ?? undefined) : undefined
  }
  if (!isSlvFoodId(id)) return getFood(db, id)
  return (await loadSlvFoods()).find((f) => f.id === id)
}

/** Som findFood för flera id, i samma ordning. Id som saknas hoppas över. */
export async function findFoods(db: MumsaDb, ids: readonly string[]): Promise<Food[]> {
  const slvIds = ids.filter(isSlvFoodId)
  const [stored, recipes, slv] = await Promise.all([
    getFoods(db, ids.filter((id) => !isSlvFoodId(id) && !isRecipeFoodId(id))),
    getRecipes(db, ids.filter(isRecipeFoodId)),
    slvIds.length > 0 ? loadSlvFoods() : Promise.resolve([]),
  ])
  const byId = new Map([...stored, ...toFoods(recipes), ...slv].map((f) => [f.id, f]))
  return ids.map((id) => byId.get(id)).filter((f): f is Food => f !== undefined)
}

/**
 * Slår upp en streckkod: först bland sparade livsmedel, sedan hos Open Food
 * Facts. Träffar från Open Food Facts sparas så att de finns offline nästa gång.
 * Kastar OffError om Open Food Facts inte går att nå.
 */
export async function lookupBarcode(db: MumsaDb, barcode: string, signal?: AbortSignal): Promise<Food | null> {
  const local = await findByBarcode(db, barcode)
  if (local) return local
  const remote = await getByBarcode(barcode, signal)
  if (remote) await cacheOffFoods(db, [remote])
  return remote
}
