import { customFoodId } from '../domain/foodIds'
import type { Food } from '../domain/types'
import { newId, type MumsaDb } from './db'

export type CustomFoodInput = Omit<Food, 'id' | 'source' | 'updatedAt'>

export function getFood(db: MumsaDb, id: string): Promise<Food | undefined> {
  return db.foods.get(id)
}

export async function getFoods(db: MumsaDb, ids: readonly string[]): Promise<Food[]> {
  const foods = await db.foods.bulkGet([...ids])
  return foods.filter((f): f is Food => f !== undefined)
}

/** Egna livsmedel går före livsmedel från Open Food Facts med samma streckkod. */
export async function findByBarcode(db: MumsaDb, barcode: string): Promise<Food | undefined> {
  const matches = await db.foods.where('barcode').equals(barcode).toArray()
  return matches.find((f) => f.source === 'custom') ?? matches[0]
}

export function listCustomFoods(db: MumsaDb): Promise<Food[]> {
  return db.foods.where('source').equals('custom').sortBy('name')
}

/** Sparar livsmedel hämtade från Open Food Facts så att de finns offline. */
export async function cacheOffFoods(db: MumsaDb, foods: readonly Food[]): Promise<void> {
  await db.foods.bulkPut(foods.filter((f) => f.source === 'off'))
}

export async function createCustomFood(db: MumsaDb, input: CustomFoodInput, now = new Date()): Promise<Food> {
  const food: Food = { ...input, id: customFoodId(newId()), source: 'custom', updatedAt: now.toISOString() }
  await db.foods.add(food)
  return food
}

export async function updateCustomFood(db: MumsaDb, id: string, input: CustomFoodInput, now = new Date()): Promise<Food> {
  const existing = await db.foods.get(id)
  if (existing?.source !== 'custom') throw new Error('Bara egna livsmedel kan ändras.')
  const food: Food = { ...input, id, source: 'custom', updatedAt: now.toISOString() }
  await db.foods.put(food)
  return food
}

/** Loggposter påverkas inte eftersom de har en egen kopia av näringen. */
export async function deleteCustomFood(db: MumsaDb, id: string): Promise<void> {
  const existing = await db.foods.get(id)
  if (existing?.source !== 'custom') throw new Error('Bara egna livsmedel kan tas bort.')
  await db.foods.delete(id)
}
