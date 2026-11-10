import { isValidAmount, portionsToGrams } from '../nutrition/nutrition'
import { MEASURE_UNITS, type Food, type MeasureUnit, type Measures } from '../types'

/** Enheter som en mängd kan anges i. Allt räknas om till gram innan det sparas. */
export type AmountUnit = 'g' | 'portion' | MeasureUnit

/** Milliliter per volymmått, enligt svensk standard. */
const ML_PER_UNIT = { dl: 100, msk: 15, tsk: 5 } as const

/** Tyngsta rimliga vikt per dl. Honung och sirap väger runt 140 g per dl. */
export const MAX_GRAMS_PER_DL = 250

/**
 * Gram för ett mått. Uppmätta värden går först. Msk och tsk räknas annars
 * fram från dl, men dl räknas aldrig fram från de mindre måtten eftersom
 * felet då blir för stort.
 */
export function measureGrams(measures: Measures | undefined, unit: MeasureUnit): number | null {
  const measured = measures?.[unit]
  if (measured !== undefined && measured > 0) return measured
  const dl = measures?.dl
  if (unit !== 'st' && unit !== 'dl' && dl !== undefined && dl > 0) return (dl * ML_PER_UNIT[unit]) / ML_PER_UNIT.dl
  return null
}

/** Måtten som går att använda för ett livsmedel, i fast ordning. */
export function availableMeasures(measures: Measures | undefined): MeasureUnit[] {
  return MEASURE_UNITS.filter((unit) => measureGrams(measures, unit) !== null)
}

/** Gram för en enhet av livsmedlet, eller null om enheten inte går att använda. */
export function unitGrams(food: Pick<Food, 'servingGrams' | 'measures'>, unit: AmountUnit): number | null {
  if (unit === 'g') return 1
  if (unit === 'portion') return portionsToGrams(food, 1)
  return measureGrams(food.measures, unit)
}

/** Enheterna som går att välja för ett livsmedel: gram, hushållsmått och sist portion. */
export function amountUnits(food: Pick<Food, 'servingGrams' | 'measures'>): AmountUnit[] {
  return ['g', ...availableMeasures(food.measures), ...(unitGrams(food, 'portion') === null ? [] : ['portion' as const])]
}

export function isValidGramsPerDl(grams: number): boolean {
  return Number.isFinite(grams) && grams > 0 && grams <= MAX_GRAMS_PER_DL
}

function isValidMeasure(unit: string, grams: unknown): boolean {
  if (typeof grams !== 'number') return false
  // Ett styck kan väga mer än en dl, t.ex. en hel majskolv
  if (unit === 'st') return isValidAmount(grams)
  if (unit === 'dl' || unit === 'msk' || unit === 'tsk') return isValidGramsPerDl((grams * ML_PER_UNIT.dl) / ML_PER_UNIT[unit])
  return false
}

/** Sant om värdet är ett giltigt Measures-objekt med minst ett mått, t.ex. från en importfil. */
export function isValidMeasures(value: unknown): value is Measures {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const entries = Object.entries(value)
  return entries.length > 0 && entries.every(([unit, grams]) => isValidMeasure(unit, grams))
}
