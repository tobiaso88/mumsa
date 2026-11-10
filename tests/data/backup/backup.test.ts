import { makeEntry, makeFood, makeRecipe } from '../../helpers/testData'
import { exportAll, importAll } from '../../../src/data/backup/backup'
import type { MumsaDb } from '../../../src/data/db/db'
import { getFavoriteIds, getGoals, getProfile, saveFavoriteIds } from '../../../src/data/repos/settingsRepo'
import { createTestDb } from '../../helpers/testDb'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(async () => {
  vi.restoreAllMocks()
  await db.delete()
})

const goals = { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } }
const profile = { weightKg: 70, heightCm: 175, ageYears: 30, sex: 'female', activity: 'light' } as const

async function seed(target: MumsaDb) {
  await target.foods.bulkPut([makeFood({ id: 'custom:a' }), makeFood({ id: 'off:123456', source: 'off', barcode: '123456' })])
  await target.entries.put(makeEntry({ id: 'e1', foodId: 'custom:a' }))
  await target.settings.put({ key: 'goals', value: goals })
  await target.weights.put({ date: '2026-10-20', kg: 70.4, createdAt: '2026-10-20T07:00:00.000Z' })
  await target.recipes.put(makeRecipe({ id: 'recipe:a' }))
  await saveFavoriteIds(target, ['custom:a', 'slv:702'])
}

it('återställer exakt samma data efter export och import', async () => {
  await seed(db)
  await db.settings.put({ key: 'profile', value: profile })
  const exported = await exportAll(db)

  const target = createTestDb()
  await target.entries.put(makeEntry({ id: 'gammal' }))
  await target.weights.put({ date: '2026-01-01', kg: 90, createdAt: '2026-01-01T07:00:00.000Z' })
  await target.recipes.put(makeRecipe({ id: 'recipe:gammal' }))
  await saveFavoriteIds(target, ['custom:gammal'])
  expect(await importAll(target, exported, 'replace')).toEqual({ foods: 2, entries: 1, weights: 1, recipes: 1 })

  expect(await target.foods.toArray()).toEqual(await db.foods.toArray())
  expect((await target.entries.toArray()).map((e) => e.id)).toEqual(['e1'])
  expect(await getGoals(target)).toEqual(goals)
  expect(await getProfile(target)).toEqual(profile)
  expect(await target.weights.toArray()).toEqual(await db.weights.toArray())
  expect(await target.recipes.toArray()).toEqual(await db.recipes.toArray())
  expect(await getFavoriteIds(target)).toEqual(['custom:a', 'slv:702'])
  await target.delete()
})

it('behåller befintlig data vid sammanslagning', async () => {
  await seed(db)
  const exported = await exportAll(db)
  await db.entries.put(makeEntry({ id: 'egen' }))
  await importAll(db, { ...exported, entries: [makeEntry({ id: 'e1', grams: 10 })] }, 'merge')
  const entries = await db.entries.toArray()
  expect(entries.map((e) => e.id).sort()).toEqual(['e1', 'egen'])
  expect(entries.find((e) => e.id === 'e1')?.grams).toBe(10)
})

it('behåller egna recept vid sammanslagning', async () => {
  await seed(db)
  const exported = await exportAll(db)
  await db.recipes.put(makeRecipe({ id: 'recipe:egen' }))
  await importAll(db, exported, 'merge')
  expect((await db.recipes.toArray()).map((r) => r.id).sort()).toEqual(['recipe:a', 'recipe:egen'])
})

it('slår ihop favoriter vid sammanslagning utan dubbletter', async () => {
  await seed(db)
  const exported = await exportAll(db)
  await saveFavoriteIds(db, ['custom:egen', 'slv:702'])
  await importAll(db, exported, 'merge')
  expect(await getFavoriteIds(db)).toEqual(['custom:egen', 'slv:702', 'custom:a'])
})

it('behåller egna vägningar vid sammanslagning', async () => {
  await seed(db)
  const exported = await exportAll(db)
  await db.weights.put({ date: '2026-10-25', kg: 70, createdAt: '2026-10-25T07:00:00.000Z' })
  await importAll(db, exported, 'merge')
  expect((await db.weights.toArray()).map((w) => w.date)).toEqual(['2026-10-20', '2026-10-25'])
})

it('lämnar databasen orörd om skrivningen misslyckas', async () => {
  await seed(db)
  const exported = await exportAll(db)
  vi.spyOn(db.entries, 'bulkPut').mockRejectedValueOnce(new Error('QuotaExceededError'))

  await expect(importAll(db, { ...exported, foods: [], entries: [makeEntry({ id: 'ny' })] }, 'replace')).rejects.toThrow()
  expect((await db.foods.toArray()).map((f) => f.id).sort()).toEqual(['custom:a', 'off:123456'])
  expect((await db.entries.toArray()).map((e) => e.id)).toEqual(['e1'])
  expect(await getGoals(db)).toEqual(goals)
})
