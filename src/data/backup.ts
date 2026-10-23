import { createExport, validateImport, type ExportData } from '../domain/exportFormat'
import type { MumsaDb } from './db'
import { getGoals, getProfile } from './settingsRepo'

export type ImportMode = 'replace' | 'merge'

export type ImportOutcome =
  | { ok: true; foods: number; entries: number }
  | { ok: false; error: string }

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
 * Läser in en export. Med 'replace' ersätts all befintlig data, med 'merge'
 * läggs datan till och poster med samma id skrivs över. Allt sker i en
 * transaktion, så vid fel lämnas databasen orörd.
 */
export async function importAll(db: MumsaDb, json: unknown, mode: ImportMode): Promise<ImportOutcome> {
  const result = validateImport(json)
  if (!result.ok) return result
  const { foods, entries, goals, profile } = result.data
  await db.transaction('rw', db.foods, db.entries, db.settings, async () => {
    if (mode === 'replace') {
      await Promise.all([db.foods.clear(), db.entries.clear(), db.settings.clear()])
    }
    await db.foods.bulkPut(foods)
    await db.entries.bulkPut(entries)
    if (goals) await db.settings.put({ key: 'goals', value: goals })
    if (profile) await db.settings.put({ key: 'profile', value: profile })
  })
  return { ok: true, foods: foods.length, entries: entries.length }
}
