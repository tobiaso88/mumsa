import { KCAL_PER_GRAM } from './goals'
import type { Nutrients } from './types'

export type NutrientIssue = 'negative' | 'macrosOver100' | 'kcalTooHigh'

/** Liten marginal över 100 g eftersom fett i rena fetter kan redovisas strax över 100 g. */
export const MAX_MACROS_PER_100G = 105
/** Rent fett ger cirka 900 kcal per 100 g. Gränsen har lite marginal för avrundning. */
export const MAX_KCAL_PER_100G = 950
/** Längsta namn, varumärke eller portionsbeskrivning. Gäller både formulär, import och Open Food Facts. */
export const MAX_TEXT_LENGTH = 200

/** Hårda fel som gör värdena omöjliga per 100 g. */
export function nutrientIssues(n: Nutrients): NutrientIssue[] {
  const issues: NutrientIssue[] = []
  if ([n.kcal, n.protein, n.carbs, n.fat].some((v) => !Number.isFinite(v) || v < 0)) issues.push('negative')
  if (n.protein + n.carbs + n.fat > MAX_MACROS_PER_100G) issues.push('macrosOver100')
  if (n.kcal > MAX_KCAL_PER_100G) issues.push('kcalTooHigh')
  return issues
}

/** Energi beräknad från makronäringsämnena, utan fibrer och alkohol. */
export function kcalFromMacros(n: Omit<Nutrients, 'kcal'>): number {
  return n.protein * KCAL_PER_GRAM.protein + n.carbs * KCAL_PER_GRAM.carbs + n.fat * KCAL_PER_GRAM.fat
}

/**
 * Sant om angiven energi skiljer sig mycket från den beräknade. Används som
 * en mjuk varning för skrivfel, eftersom fibrer och alkohol också ger energi.
 */
export function kcalLooksOff(n: Nutrients): boolean {
  const expected = kcalFromMacros(n)
  return Math.abs(n.kcal - expected) > Math.max(40, expected * 0.25)
}
