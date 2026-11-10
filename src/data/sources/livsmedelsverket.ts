import { slvFoodId } from '../../domain/foods/foodIds'
import type { Food, Measures } from '../../domain/types'
import { measuresByNummer, type VolymvikterDataset } from './volymvikter'

/** [nummer, namn, kcal, protein, kolhydrater, fett] per 100 g ätlig del. */
type Row = [number, string, number, number, number, number]

export type SlvDataset = {
  source: string
  license: string
  retrieved: string
  rows: Row[]
}

export function slvRowToFood([nummer, name, kcal, protein, carbs, fat]: Row, retrieved: string, measures?: Measures): Food {
  return {
    id: slvFoodId(nummer),
    name,
    source: 'slv',
    per100g: { kcal, protein, carbs, fat },
    ...(measures && { measures }),
    updatedAt: retrieved,
  }
}

/**
 * Livsmedelsverkets livsmedel, buntade med appen, med hushållsmått där sådana
 * finns. Filerna laddas först när de behövs och fungerar offline eftersom de
 * ingår i appens egna filer.
 */
export async function loadSlvFoods(): Promise<Food[]> {
  // Filernas form kontrolleras i livsmedelsverket.test.ts och volymvikter.test.ts
  const [{ default: data }, { default: volymvikter }] = (await Promise.all([
    import('./livsmedelsverket.json'),
    import('./volymvikter.json'),
  ])) as unknown as [{ default: SlvDataset }, { default: VolymvikterDataset }]
  const measures = measuresByNummer(volymvikter)
  return data.rows.map((row) => slvRowToFood(row, data.retrieved, measures.get(row[0])))
}
