import { makeEntry, makeFood } from '../domain/testData'
import { exportAll, importAll } from './backup'
import type { MumsaDb } from './db'
import { getGoals, getProfile } from './settingsRepo'
import { createTestDb } from './testDb'

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
}

it('återställer exakt samma data efter export och import', async () => {
  await seed(db)
  await db.settings.put({ key: 'profile', value: profile })
  const exported = await exportAll(db)

  const target = createTestDb()
  await target.entries.put(makeEntry({ id: 'gammal' }))
  expect(await importAll(target, exported, 'replace')).toEqual({ foods: 2, entries: 1 })

  expect(await target.foods.toArray()).toEqual(await db.foods.toArray())
  expect((await target.entries.toArray()).map((e) => e.id)).toEqual(['e1'])
  expect(await getGoals(target)).toEqual(goals)
  expect(await getProfile(target)).toEqual(profile)
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

it('lämnar databasen orörd om skrivningen misslyckas', async () => {
  await seed(db)
  const exported = await exportAll(db)
  vi.spyOn(db.entries, 'bulkPut').mockRejectedValueOnce(new Error('QuotaExceededError'))

  await expect(importAll(db, { ...exported, foods: [], entries: [makeEntry({ id: 'ny' })] }, 'replace')).rejects.toThrow()
  expect((await db.foods.toArray()).map((f) => f.id).sort()).toEqual(['custom:a', 'off:123456'])
  expect((await db.entries.toArray()).map((e) => e.id)).toEqual(['e1'])
  expect(await getGoals(db)).toEqual(goals)
})
