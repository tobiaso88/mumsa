import { createDb, type MumsaDb } from '../../src/data/db/db'

/** Skapar en tom databas med unikt namn. Används bara i tester. */
export function createTestDb(): MumsaDb {
  return createDb(`test-${crypto.randomUUID()}`)
}
