import { makeEntry } from '../domain/testData'
import type { MumsaDb } from './db'
import {
  addEntry,
  deleteEntry,
  getEntriesForDate,
  getEntriesInRange,
  getRecentFoodIds,
  updateEntry,
  type NewEntry,
} from './entriesRepo'
import { createTestDb } from './testDb'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(() => db.delete())

function input(overrides: Partial<NewEntry> = {}): NewEntry {
  const { id, createdAt, ...rest } = makeEntry(overrides)
  return rest
}

it('lägger till, ändrar och tar bort poster', async () => {
  const entry = await addEntry(db, input({ grams: 40 }))
  expect(await getEntriesForDate(db, entry.date)).toEqual([entry])

  await updateEntry(db, entry.id, { grams: 60, meal: 'snack' })
  const [updated] = await getEntriesForDate(db, entry.date)
  expect(updated).toMatchObject({ grams: 60, meal: 'snack', per100g: entry.per100g })

  await deleteEntry(db, entry.id)
  expect(await getEntriesForDate(db, entry.date)).toEqual([])
})

it('kastar fel när en post som saknas ändras', async () => {
  await expect(updateEntry(db, 'saknas', { grams: 1 })).rejects.toThrow('finns inte')
})

it('sorterar dagens poster i den ordning de loggades', async () => {
  await addEntry(db, input({ foodName: 'Andra' }), new Date('2026-10-20T12:00:00Z'))
  await addEntry(db, input({ foodName: 'Första' }), new Date('2026-10-20T07:00:00Z'))
  expect((await getEntriesForDate(db, '2026-10-20')).map((e) => e.foodName)).toEqual(['Första', 'Andra'])
})

it('hämtar poster inom ett datumintervall inklusive gränserna', async () => {
  for (const date of ['2026-10-18', '2026-10-19', '2026-10-25', '2026-10-26']) {
    await addEntry(db, input({ date }))
  }
  const dates = (await getEntriesInRange(db, '2026-10-19', '2026-10-25')).map((e) => e.date).sort()
  expect(dates).toEqual(['2026-10-19', '2026-10-25'])
})

it('ger senast loggade livsmedel utan dubbletter', async () => {
  const times = ['2026-10-20T07:00:00Z', '2026-10-20T08:00:00Z', '2026-10-20T09:00:00Z', '2026-10-20T10:00:00Z']
  const foods = ['a', 'b', 'a', 'c']
  for (const [i, foodId] of foods.entries()) {
    await addEntry(db, input({ foodId }), new Date(times[i]!))
  }
  expect(await getRecentFoodIds(db)).toEqual(['c', 'a', 'b'])
  expect(await getRecentFoodIds(db, 2)).toEqual(['c', 'a'])
})
