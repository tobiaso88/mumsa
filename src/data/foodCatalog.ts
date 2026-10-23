import { searchFoods } from '../domain/search'
import type { Food } from '../domain/types'
import type { MumsaDb } from './db'
import { getFood, getFoods } from './foodsRepo'
import { loadSlvFoods } from './livsmedelsverket'

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
  if (!id.startsWith('slv:')) return getFood(db, id)
  return (await loadSlvFoods()).find((f) => f.id === id)
}

/** Som findFood för flera id, i samma ordning. Id som saknas hoppas över. */
export async function findFoods(db: MumsaDb, ids: readonly string[]): Promise<Food[]> {
  const slvIds = ids.filter((id) => id.startsWith('slv:'))
  const [stored, slv] = await Promise.all([
    getFoods(db, ids.filter((id) => !id.startsWith('slv:'))),
    slvIds.length > 0 ? loadSlvFoods() : Promise.resolve([]),
  ])
  const byId = new Map([...stored, ...slv].map((f) => [f.id, f]))
  return ids.map((id) => byId.get(id)).filter((f): f is Food => f !== undefined)
}
