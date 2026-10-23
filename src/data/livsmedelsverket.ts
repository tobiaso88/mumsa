import type { Food } from '../domain/types'

/** [nummer, namn, kcal, protein, kolhydrater, fett] per 100 g ätlig del. */
type Row = [number, string, number, number, number, number]

export type SlvDataset = {
  source: string
  license: string
  retrieved: string
  rows: Row[]
}

export const SLV_ATTRIBUTION = 'Källa: Livsmedelsverkets livsmedelsdatabas (CC BY 4.0)'

export function slvRowToFood([nummer, name, kcal, protein, carbs, fat]: Row, retrieved: string): Food {
  return {
    id: `slv:${nummer}`,
    name,
    source: 'slv',
    per100g: { kcal, protein, carbs, fat },
    updatedAt: retrieved,
  }
}

/**
 * Livsmedelsverkets livsmedel, buntade med appen. Filen laddas först när den
 * behövs och fungerar offline eftersom den ingår i appens egna filer.
 */
export async function loadSlvFoods(): Promise<Food[]> {
  // Filens form garanteras av byggskriptet och kontrolleras i livsmedelsverket.test.ts
  const { default: data } = (await import('./livsmedelsverket.json')) as unknown as { default: SlvDataset }
  return data.rows.map((row) => slvRowToFood(row, data.retrieved))
}
