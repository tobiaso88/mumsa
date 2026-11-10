import type { MumsaDb } from '../../../src/data/db/db'
import {
  getFavoriteIds,
  getGoals,
  getProfile,
  saveFavoriteIds,
  saveGoals,
  saveProfile,
  toggleFavoriteId,
} from '../../../src/data/repos/settingsRepo'
import { createTestDb } from '../../helpers/testDb'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
})
afterEach(() => db.delete())

it('ger null innan mål och profil är sparade', async () => {
  expect(await getGoals(db)).toBeNull()
  expect(await getProfile(db)).toBeNull()
})

it('sparar och skriver över mål och profil', async () => {
  await saveGoals(db, { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } })
  await saveGoals(db, { kcal: 1800, split: { proteinPct: 30, carbsPct: 40, fatPct: 30 } })
  expect((await getGoals(db))?.kcal).toBe(1800)

  const profile = { weightKg: 70, heightCm: 175, ageYears: 30, sex: 'female', activity: 'light' } as const
  await saveProfile(db, profile)
  expect(await getProfile(db)).toEqual(profile)
})

it('ger inga favoriter innan någon är sparad', async () => {
  expect(await getFavoriteIds(db)).toEqual([])
})

it('sparar favoriter i ordning och skriver över listan', async () => {
  await saveFavoriteIds(db, ['a', 'b'])
  expect(await getFavoriteIds(db)).toEqual(['a', 'b'])
  await saveFavoriteIds(db, ['c'])
  expect(await getFavoriteIds(db)).toEqual(['c'])
})

it('lägger till och tar bort en favorit', async () => {
  await toggleFavoriteId(db, 'a')
  await toggleFavoriteId(db, 'b')
  expect(await getFavoriteIds(db)).toEqual(['a', 'b'])
  await toggleFavoriteId(db, 'a')
  expect(await getFavoriteIds(db)).toEqual(['b'])
})

it('rör inte mål och profil när favoriter sparas', async () => {
  await saveGoals(db, { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } })
  await toggleFavoriteId(db, 'a')
  expect((await getGoals(db))?.kcal).toBe(2000)
})
