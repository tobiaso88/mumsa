import Dexie from 'dexie'
import { makeEntry, makeFood } from '../domain/testData'
import { createDb } from './db'

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
  expect(db.verno).toBe(2)
  await db.delete()
})
