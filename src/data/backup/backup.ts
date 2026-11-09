import { createExport, type ExportData } from '../../domain/backup/exportFormat'
import type { MumsaDb } from '../db/db'
import { getGoals, getProfile, saveGoals, saveProfile } from '../repos/settingsRepo'
import { getWeights } from '../repos/weightsRepo'

export type ImportMode = 'replace' | 'merge'

export type ImportCounts = { foods: number; entries: number; weights: number; recipes: number }

export async function exportAll(db: MumsaDb, now = new Date()): Promise<ExportData> {
  return db.transaction('r', [db.foods, db.entries, db.settings, db.weights, db.recipes], async () =>
    createExport(
      {
        foods: await db.foods.toArray(),
        entries: await db.entries.toArray(),
        goals: await getGoals(db),
        profile: await getProfile(db),
        weights: await getWeights(db),
        recipes: await db.recipes.toArray(),
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
  const { foods, entries, goals, profile, weights, recipes } = data
  await db.transaction('rw', [db.foods, db.entries, db.settings, db.weights, db.recipes], async () => {
    if (mode === 'replace') {
      await Promise.all([db.foods.clear(), db.entries.clear(), db.settings.clear(), db.weights.clear(), db.recipes.clear()])
    }
    await db.foods.bulkPut(foods)
    await db.entries.bulkPut(entries)
    await db.weights.bulkPut(weights)
    await db.recipes.bulkPut(recipes)
    if (goals) await saveGoals(db, goals)
    if (profile) await saveProfile(db, profile)
  })
  return { foods: foods.length, entries: entries.length, weights: weights.length, recipes: recipes.length }
}
