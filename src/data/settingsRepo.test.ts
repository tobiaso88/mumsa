import type { MumsaDb } from './db'
import { getGoals, getProfile, saveGoals, saveProfile } from './settingsRepo'
import { createTestDb } from './testDb'

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
