import {
  bmr,
  DEFAULT_SPLIT,
  estimateDailyKcal,
  GOAL_KCAL_MAX,
  GOAL_KCAL_MIN,
  isValidGoalKcal,
  isValidProfile,
  isValidSplit,
  macroGrams,
} from './goals'
import type { Profile } from './types'

const profile: Profile = { weightKg: 70, heightCm: 175, ageYears: 30, sex: 'male', activity: 'moderate' }

describe('bmr', () => {
  it('följer Mifflin–St Jeor för män', () => {
    expect(bmr(profile)).toBe(700 + 1093.75 - 150 + 5)
  })
  it('följer Mifflin–St Jeor för kvinnor', () => {
    expect(bmr({ ...profile, sex: 'female' })).toBe(700 + 1093.75 - 150 - 161)
  })
})

describe('estimateDailyKcal', () => {
  it('multiplicerar med aktivitetsfaktorn', () => {
    expect(estimateDailyKcal(profile)).toBeCloseTo(1648.75 * 1.55)
    expect(estimateDailyKcal({ ...profile, activity: 'sedentary' })).toBeCloseTo(1648.75 * 1.2)
  })
})

describe('isValidSplit', () => {
  it('godkänner standardfördelningen', () => {
    expect(isValidSplit(DEFAULT_SPLIT)).toBe(true)
  })
  it('kräver att summan blir 100', () => {
    expect(isValidSplit({ proteinPct: 30, carbsPct: 40, fatPct: 20 })).toBe(false)
  })
  it('avvisar negativa värden', () => {
    expect(isValidSplit({ proteinPct: -10, carbsPct: 80, fatPct: 30 })).toBe(false)
  })
})

describe('isValidGoalKcal', () => {
  it('godkänner gränsvärdena', () => {
    expect(isValidGoalKcal(GOAL_KCAL_MIN)).toBe(true)
    expect(isValidGoalKcal(2000)).toBe(true)
    expect(isValidGoalKcal(GOAL_KCAL_MAX)).toBe(true)
  })
  it('avvisar värden utanför gränserna och ogiltiga tal', () => {
    expect(isValidGoalKcal(GOAL_KCAL_MIN - 1)).toBe(false)
    expect(isValidGoalKcal(GOAL_KCAL_MAX + 1)).toBe(false)
    expect(isValidGoalKcal(NaN)).toBe(false)
  })
})

describe('macroGrams', () => {
  it('räknar om energiandelar till gram', () => {
    expect(macroGrams(2000, { proteinPct: 20, carbsPct: 50, fatPct: 30 })).toEqual({
      protein: 100,
      carbs: 250,
      fat: 2000 * 0.3 / 9,
    })
  })
})

describe('isValidProfile', () => {
  it('godkänner en rimlig profil', () => {
    expect(isValidProfile(profile)).toBe(true)
  })
  it.each<Partial<Profile>>([{ weightKg: 0 }, { heightCm: 20 }, { ageYears: 17 }, { ageYears: 130 }])(
    'avvisar %o',
    (override) => {
      expect(isValidProfile({ ...profile, ...override })).toBe(false)
    },
  )
})
