import { makeFood } from '../domain/testData'
import type { MumsaDb } from './db'
import {
  cacheOffFoods,
  createCustomFood,
  deleteCustomFood,
  findByBarcode,
  getFood,
  getFoods,
  listCustomFoods,
  updateCustomFood,
} from './foodsRepo'
import { createTestDb } from './testDb'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(() => db.delete())

const per100g = { kcal: 100, protein: 1, carbs: 2, fat: 3 }

describe('egna livsmedel', () => {
  it('skapar, ändrar och tar bort', async () => {
    const food = await createCustomFood(db, { name: 'Mormors bullar', per100g }, new Date('2026-10-01T00:00:00Z'))
    expect(food.id).toMatch(/^custom:/)
    expect(food.source).toBe('custom')
    expect(await getFood(db, food.id)).toEqual(food)

    const updated = await updateCustomFood(db, food.id, { name: 'Mormors kanelbullar', per100g })
    expect((await getFood(db, food.id))?.name).toBe(updated.name)

    await deleteCustomFood(db, food.id)
    expect(await getFood(db, food.id)).toBeUndefined()
  })

  it('vägrar ändra eller ta bort livsmedel från Open Food Facts', async () => {
    await cacheOffFoods(db, [makeFood({ id: 'off:1', source: 'off' })])
    await expect(updateCustomFood(db, 'off:1', { name: 'x', per100g })).rejects.toThrow()
    await expect(deleteCustomFood(db, 'off:1')).rejects.toThrow()
  })

  it('listar bara egna, sorterade på namn', async () => {
    await createCustomFood(db, { name: 'Ölbröd', per100g })
    await createCustomFood(db, { name: 'Äppelkaka', per100g })
    await cacheOffFoods(db, [makeFood({ id: 'off:1', source: 'off', name: 'Banan' })])
    expect((await listCustomFoods(db)).map((f) => f.name)).toEqual(['Äppelkaka', 'Ölbröd'])
  })
})

describe('findByBarcode', () => {
  it('föredrar eget livsmedel framför Open Food Facts', async () => {
    await cacheOffFoods(db, [makeFood({ id: 'off:123456', source: 'off', barcode: '123456' })])
    expect((await findByBarcode(db, '123456'))?.id).toBe('off:123456')
    const own = await createCustomFood(db, { name: 'Rättad', barcode: '123456', per100g })
    expect((await findByBarcode(db, '123456'))?.id).toBe(own.id)
  })

  it('ger undefined för okänd streckkod', async () => {
    expect(await findByBarcode(db, '999')).toBeUndefined()
  })
})

describe('getFoods', () => {
  it('hoppar över id som saknas', async () => {
    await cacheOffFoods(db, [makeFood({ id: 'off:1', source: 'off' })])
    expect((await getFoods(db, ['off:1', 'saknas'])).map((f) => f.id)).toEqual(['off:1'])
  })
})
