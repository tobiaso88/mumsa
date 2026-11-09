import Dexie from 'dexie'
import { makeEntry, makeFood } from '../../helpers/testData'
import { createDb } from '../../../src/data/db/db'

it('behåller all data när en databas från version 1 uppgraderas', async () => {
  const name = `test-${crypto.randomUUID()}`
  const v1 = new Dexie(name)
  v1.version(1).stores({ foods: 'id, barcode, source, name', entries: 'id, date, foodId, createdAt', settings: 'key' })
  const goals = { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } }
  await v1.table('foods').put(makeFood({ id: 'custom:a' }))
  await v1.table('entries').put(makeEntry({ id: 'e1' }))
  await v1.table('settings').put({ key: 'goals', value: goals })
  v1.close()

  const db = createDb(name)
  expect((await db.foods.toArray()).map((f) => f.id)).toEqual(['custom:a'])
  expect((await db.entries.toArray()).map((e) => e.id)).toEqual(['e1'])
  expect(await db.settings.get('goals')).toEqual({ key: 'goals', value: goals })
  expect(await db.weights.toArray()).toEqual([])
  expect(await db.recipes.toArray()).toEqual([])
  expect(db.verno).toBe(3)
  await db.delete()
})

it('behåller vägningar när en databas från version 2 uppgraderas', async () => {
  const name = `test-${crypto.randomUUID()}`
  const v2 = new Dexie(name)
  v2.version(1).stores({ foods: 'id, barcode, source, name', entries: 'id, date, foodId, createdAt', settings: 'key' })
  v2.version(2).stores({ weights: 'date' })
  await v2.table('weights').put({ date: '2026-10-20', kg: 70, createdAt: '2026-10-20T07:00:00.000Z' })
  v2.close()

  const db = createDb(name)
  expect((await db.weights.toArray()).map((w) => w.date)).toEqual(['2026-10-20'])
  expect(await db.recipes.toArray()).toEqual([])
  await db.delete()
})
