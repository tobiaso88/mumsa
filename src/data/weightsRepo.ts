import type { IsoDate, WeightEntry } from '../domain/types'
import type { MumsaDb } from './db'

/** Sparar dagens vägning. En ny vägning samma dag ersätter den gamla. */
export async function logWeight(db: MumsaDb, date: IsoDate, kg: number, now = new Date()): Promise<WeightEntry> {
  const entry: WeightEntry = { date, kg, createdAt: now.toISOString() }
  await db.weights.put(entry)
  return entry
}

export async function deleteWeight(db: MumsaDb, date: IsoDate): Promise<void> {
  await db.weights.delete(date)
}

/** Alla vägningar, äldst först. */
export function getWeights(db: MumsaDb): Promise<WeightEntry[]> {
  return db.weights.orderBy('date').toArray()
}
