import Dexie, { type EntityTable } from 'dexie'
import type { Food, Goals, LogEntry, Profile } from '../domain/types'

export type SettingRow = { key: 'goals'; value: Goals } | { key: 'profile'; value: Profile }

export type MumsaDb = Dexie & {
  foods: EntityTable<Food, 'id'>
  entries: EntityTable<LogEntry, 'id'>
  settings: EntityTable<SettingRow, 'key'>
}

/**
 * Skapar databasen. Instansen hålls i React context, inte i modulen.
 * Schemaändringar görs genom att lägga till en ny version med upgrade(),
 * aldrig genom att ändra en befintlig version.
 */
export function createDb(name = 'mumsa'): MumsaDb {
  const db = new Dexie(name) as MumsaDb
  db.version(1).stores({
    foods: 'id, barcode, source, name',
    entries: 'id, date, foodId, createdAt',
    settings: 'key',
  })
  return db
}

export function newId(): string {
  return crypto.randomUUID()
}
