import { isQuickFoodId } from '../../domain/foods/foodIds'
import type { NewLogEntry } from '../../domain/nutrition/copyMeal'
import type { IsoDate, LogEntry } from '../../domain/types'
import { newId, type MumsaDb } from '../db/db'

export type NewEntry = NewLogEntry
export type EntryChanges = Partial<Pick<LogEntry, 'grams' | 'meal' | 'date' | 'foodName'>>

export async function addEntry(db: MumsaDb, input: NewEntry, now = new Date()): Promise<LogEntry> {
  const entry: LogEntry = { ...input, id: newId(), createdAt: now.toISOString() }
  await db.entries.add(entry)
  return entry
}

/**
 * Lägger till flera poster på en gång. Varje post får en millisekund senare
 * tidpunkt än den förra, så att de behåller sin ordning när dagen visas.
 */
export async function addEntries(db: MumsaDb, inputs: readonly NewEntry[], now = new Date()): Promise<LogEntry[]> {
  const entries = inputs.map((input, i): LogEntry => ({ ...input, id: newId(), createdAt: new Date(now.getTime() + i).toISOString() }))
  await db.entries.bulkAdd(entries)
  return entries
}

export async function updateEntry(db: MumsaDb, id: string, changes: EntryChanges): Promise<void> {
  const updated = await db.entries.update(id, changes)
  if (updated === 0) throw new Error('Loggposten finns inte.')
}

export async function deleteEntry(db: MumsaDb, id: string): Promise<void> {
  await db.entries.delete(id)
}

export function getEntriesForDate(db: MumsaDb, date: IsoDate): Promise<LogEntry[]> {
  return db.entries.where('date').equals(date).sortBy('createdAt')
}

/** Poster från och med from till och med to. */
export function getEntriesInRange(db: MumsaDb, from: IsoDate, to: IsoDate): Promise<LogEntry[]> {
  return db.entries.where('date').between(from, to, true, true).toArray()
}

/** Id för de senast loggade livsmedlen, nyast först och utan dubbletter. */
export async function getRecentFoodIds(db: MumsaDb, limit = 15): Promise<string[]> {
  const ids = new Set<string>()
  await db.entries
    .orderBy('createdAt')
    .reverse()
    .until(() => ids.size >= limit)
    .each((e) => {
      // Snabbregistreringar är inget livsmedel som går att logga igen
      if (!isQuickFoodId(e.foodId)) ids.add(e.foodId)
    })
  return [...ids].slice(0, limit)
}
