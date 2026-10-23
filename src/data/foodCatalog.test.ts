import { makeFood } from '../domain/testData'
import type { MumsaDb } from './db'
import { findFood, findFoods, searchAllFoods } from './foodCatalog'
import { cacheOffFoods, createCustomFood } from './foodsRepo'
import { createTestDb } from './testDb'

vi.mock('./livsmedelsverket.json', () => ({
  default: {
    source: 'Livsmedelsverkets livsmedelsdatabas',
    license: 'CC BY 4.0',
    retrieved: '2026-10-23',
    rows: [
      [1, 'Mjölk fett 3%', 60, 3.4, 4.8, 3],
      [2, 'Havregryn', 370, 13, 59, 7],
    ],
  },
}))

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(() => db.delete())

const per100g = { kcal: 100, protein: 1, carbs: 2, fat: 3 }

it('söker i egna, sparade och buntade livsmedel med egna först', async () => {
  await cacheOffFoods(db, [makeFood({ id: 'off:1', source: 'off', name: 'Havregryn', brand: 'AXA' })])
  await createCustomFood(db, { name: 'Havregrynsgröt', per100g })
  const results = await searchAllFoods(db, 'havregryn')
  expect(results.map((f) => [f.source, f.name])).toEqual([
    ['custom', 'Havregrynsgröt'],
    ['off', 'Havregryn'],
    ['slv', 'Havregryn'],
  ])
})

it('hittar buntade livsmedel på id', async () => {
  expect(await findFood(db, 'slv:1')).toEqual({
    id: 'slv:1',
    name: 'Mjölk fett 3%',
    source: 'slv',
    per100g: { kcal: 60, protein: 3.4, carbs: 4.8, fat: 3 },
    updatedAt: '2026-10-23',
  })
  expect(await findFood(db, 'slv:999')).toBeUndefined()
})

it('slår upp blandade id i given ordning', async () => {
  const own = await createCustomFood(db, { name: 'Eget', per100g })
  const ids = (await findFoods(db, ['slv:2', own.id, 'saknas', 'slv:1'])).map((f) => f.id)
  expect(ids).toEqual(['slv:2', own.id, 'slv:1'])
})
