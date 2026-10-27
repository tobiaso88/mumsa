import { isSlvFoodId } from '../domain/foodIds'
import { searchFoods } from '../domain/search'
import type { Food } from '../domain/types'
import type { MumsaDb } from './db'
import { cacheOffFoods, findByBarcode, getFood, getFoods } from './foodsRepo'
import { loadSlvFoods } from './livsmedelsverket'
import { getByBarcode } from './openFoodFacts'

/**
 * Söker bland alla livsmedel som finns utan nätverk: egna, sparade från
 * Open Food Facts och Livsmedelsverkets buntade databas.
 */
export async function searchAllFoods(db: MumsaDb, query: string, limit = 30): Promise<Food[]> {
  const [stored, slv] = await Promise.all([db.foods.toArray(), loadSlvFoods()])
  return searchFoods([...stored, ...slv], query, limit)
}

/** Slår upp ett livsmedel oavsett om det ligger i databasen eller är buntat. */
export async function findFood(db: MumsaDb, id: string): Promise<Food | undefined> {
  if (!isSlvFoodId(id)) return getFood(db, id)
  return (await loadSlvFoods()).find((f) => f.id === id)
}

/** Som findFood för flera id, i samma ordning. Id som saknas hoppas över. */
export async function findFoods(db: MumsaDb, ids: readonly string[]): Promise<Food[]> {
  const slvIds = ids.filter(isSlvFoodId)
  const [stored, slv] = await Promise.all([
    getFoods(db, ids.filter((id) => !isSlvFoodId(id))),
    slvIds.length > 0 ? loadSlvFoods() : Promise.resolve([]),
  ])
  const byId = new Map([...stored, ...slv].map((f) => [f.id, f]))
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
