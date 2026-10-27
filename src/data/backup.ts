import { createExport, type ExportData } from '../domain/exportFormat'
import type { MumsaDb } from './db'
import { getGoals, getProfile, saveGoals, saveProfile } from './settingsRepo'

export type ImportMode = 'replace' | 'merge'

export type ImportCounts = { foods: number; entries: number }

export async function exportAll(db: MumsaDb, now = new Date()): Promise<ExportData> {
  return db.transaction('r', db.foods, db.entries, db.settings, async () =>
    createExport(
      {
        foods: await db.foods.toArray(),
        entries: await db.entries.toArray(),
        goals: await getGoals(db),
        profile: await getProfile(db),
      },
      now,
    ),
  )
}

/**
 * Läser in en export som redan har validerats med validateImport. Med
 * 'replace' ersätts all befintlig data, med 'merge' läggs datan till och
 * poster med samma id skrivs över. Allt sker i en transaktion, så vid fel
 * kastas felet och databasen lämnas orörd.
 */
export async function importAll(db: MumsaDb, data: ExportData, mode: ImportMode): Promise<ImportCounts> {
  const { foods, entries, goals, profile } = data
  await db.transaction('rw', db.foods, db.entries, db.settings, async () => {
    if (mode === 'replace') {
      await Promise.all([db.foods.clear(), db.entries.clear(), db.settings.clear()])
    }
    await db.foods.bulkPut(foods)
    await db.entries.bulkPut(entries)
    if (goals) await saveGoals(db, goals)
    if (profile) await saveProfile(db, profile)
  })
  return { foods: foods.length, entries: entries.length }
}
