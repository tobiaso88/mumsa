import { lookupBarcode } from '../../data/foodCatalog'
import { useDb } from '../dbContext'

/** Slår upp en streckkod lokalt och sedan hos Open Food Facts. Kastar OffError om Open Food Facts inte går att nå. */
export function useBarcodeLookup() {
  const db = useDb()
  return (barcode: string) => lookupBarcode(db, barcode)
}
