import { KCAL_PER_GRAM } from './goals'
import type { Nutrients } from './types'

export type NutrientIssue = 'negative' | 'macrosOver100' | 'kcalTooHigh'

/** Hårda fel som gör värdena omöjliga per 100 g. */
export function nutrientIssues(n: Nutrients): NutrientIssue[] {
  const issues: NutrientIssue[] = []
  if ([n.kcal, n.protein, n.carbs, n.fat].some((v) => !Number.isFinite(v) || v < 0)) issues.push('negative')
  // Liten marginal eftersom fett i rena fetter kan redovisas strax över 100 g
  if (n.protein + n.carbs + n.fat > 105) issues.push('macrosOver100')
  if (n.kcal > 950) issues.push('kcalTooHigh')
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
