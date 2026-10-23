import { makeEntry, makeFood } from '../domain/testData'
import { exportAll, importAll } from './backup'
import type { MumsaDb } from './db'
import { getGoals } from './settingsRepo'
import { createTestDb } from './testDb'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(() => db.delete())

const goals = { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } }

async function seed(target: MumsaDb) {
  await target.foods.bulkPut([makeFood({ id: 'a' }), makeFood({ id: 'b', source: 'off', barcode: '123456' })])
  await target.entries.put(makeEntry({ id: 'e1', foodId: 'a' }))
  await target.settings.put({ key: 'goals', value: goals })
}

it('återställer exakt samma data efter export och import', async () => {
  await seed(db)
  const exported = JSON.parse(JSON.stringify(await exportAll(db)))

  const target = createTestDb()
  await target.entries.put(makeEntry({ id: 'gammal' }))
  expect(await importAll(target, exported, 'replace')).toEqual({ ok: true, foods: 2, entries: 1 })

  expect(await target.foods.toArray()).toEqual(await db.foods.toArray())
  expect((await target.entries.toArray()).map((e) => e.id)).toEqual(['e1'])
  expect(await getGoals(target)).toEqual(goals)
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

it('lämnar databasen orörd vid ogiltig fil', async () => {
  await seed(db)
  const result = await importAll(db, { app: 'annan' }, 'replace')
  expect(result.ok).toBe(false)
  expect(await db.entries.count()).toBe(1)
})
