import { createDb, type MumsaDb } from './db'

/** Skapar en tom databas med unikt namn. Används bara i tester. */
export function createTestDb(): MumsaDb {
  return createDb(`test-${crypto.randomUUID()}`)
}
