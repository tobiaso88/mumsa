import type { ActivityLevel, Goals, MacroSplit, Nutrients, Profile } from './types'

export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const

/** Vanliga multiplikatorer för aktivitetsnivå (PAL). */
export const ACTIVITY_FACTORS: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export const DEFAULT_SPLIT: Readonly<MacroSplit> = { proteinPct: 25, carbsPct: 45, fatPct: 30 }

/** Gränser för ett dagligt kalorimål, för att fånga skrivfel. Inga rekommendationer. */
export const GOAL_KCAL_MIN = 500
export const GOAL_KCAL_MAX = 10_000

export function isValidGoalKcal(kcal: number): boolean {
  return Number.isFinite(kcal) && kcal >= GOAL_KCAL_MIN && kcal <= GOAL_KCAL_MAX
}

/** Basalomsättning enligt Mifflin–St Jeor, i kcal per dygn. */
export function bmr(profile: Omit<Profile, 'activity'>): number {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears
  return profile.sex === 'male' ? base + 5 : base - 161
}

/** Uppskattad total energiförbrukning per dygn. En uppskattning, inte ett råd. */
export function estimateDailyKcal(profile: Profile): number {
  return bmr(profile) * ACTIVITY_FACTORS[profile.activity]
}

/** Summan av andelarna i procent. Ska bli 100 för en giltig fördelning. */
export function splitTotal(split: MacroSplit): number {
  return split.proteinPct + split.carbsPct + split.fatPct
}

export function isValidSplit(split: MacroSplit): boolean {
  const parts = [split.proteinPct, split.carbsPct, split.fatPct]
  return parts.every((p) => Number.isFinite(p) && p >= 0) && Math.abs(splitTotal(split) - 100) < 1e-9
}

/** Energi kvar till målet. Negativt när intaget är över målet. */
export function kcalLeft(goal: Pick<Goals, 'kcal'>, intake: Pick<Nutrients, 'kcal'>): number {
  return goal.kcal - intake.kcal
}

/** Makromål i gram utifrån kalorimål och fördelning. */
export function macroGrams(kcal: number, split: MacroSplit): Omit<Nutrients, 'kcal'> {
  return {
    protein: (kcal * split.proteinPct) / 100 / KCAL_PER_GRAM.protein,
    carbs: (kcal * split.carbsPct) / 100 / KCAL_PER_GRAM.carbs,
    fat: (kcal * split.fatPct) / 100 / KCAL_PER_GRAM.fat,
  }
}

/** Formeln gäller vuxna, därför krävs minst 18 år. */
export function isValidProfile(profile: Profile): boolean {
  return (
    profile.weightKg > 0 &&
    profile.weightKg < 500 &&
    profile.heightCm > 50 &&
    profile.heightCm < 272 &&
    profile.ageYears >= 18 &&
    profile.ageYears < 120
  )
}
