import { lookupBarcode } from '../../data/foodCatalog'
import { OffError } from '../../data/openFoodFacts'
import type { Food } from '../../domain/types'
import { useDb } from '../dbContext'

export type BarcodeLookupResult =
  | { kind: 'found'; food: Food }
  | { kind: 'notFound' }
  /** Enheten är offline och koden finns inte sparad lokalt. */
  | { kind: 'offline' }
  /** Open Food Facts gick inte att nå eller svarade med fel. */
  | { kind: 'unreachable' }

/** Slår upp en streckkod lokalt och sedan hos Open Food Facts. */
export function useBarcodeLookup() {
  const db = useDb()
  return async (barcode: string): Promise<BarcodeLookupResult> => {
    try {
      const food = await lookupBarcode(db, barcode)
      return food ? { kind: 'found', food } : { kind: 'notFound' }
    } catch (error) {
      if (error instanceof OffError && error.kind === 'offline') return { kind: 'offline' }
      return { kind: 'unreachable' }
    }
  }
}
