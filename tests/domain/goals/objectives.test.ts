import { DEFAULT_SPLIT, isValidSplit } from '../../../src/domain/goals/goals'
import {
  adjustedDailyKcal,
  dailyKcalAdjustment,
  isCalculatedGoal,
  isValidObjective,
  makeObjective,
  MAINTAIN,
  suggestedSplit,
  weeklyWeightChange,
} from '../../../src/domain/goals/objectives'
import { OBJECTIVE_KINDS } from '../../../src/domain/types'

describe('makeObjective', () => {
  it('ger maintain utan takt', () => {
    expect(makeObjective('maintain', 'moderate')).toEqual({ kind: 'maintain' })
  })
  it('behåller takten för övriga mål', () => {
    expect(makeObjective('lose', 'slow')).toEqual({ kind: 'lose', pace: 'slow' })
  })
})

describe('weeklyWeightChange', () => {
  it('är negativ vid viktnedgång', () => {
    expect(weeklyWeightChange({ kind: 'lose', pace: 'moderate' })).toBe(-0.5)
  })
  it('är positiv vid viktuppgång och muskelbygge', () => {
    expect(weeklyWeightChange({ kind: 'gain', pace: 'slow' })).toBe(0.25)
    expect(weeklyWeightChange({ kind: 'build_muscle', pace: 'moderate' })).toBe(0.5)
  })
  it('är noll när vikten ska behållas', () => {
    expect(weeklyWeightChange(MAINTAIN)).toBe(0)
  })
})

describe('dailyKcalAdjustment', () => {
  it('räknar om takten till kcal per dag med 7 700 kcal per kg', () => {
    expect(dailyKcalAdjustment({ kind: 'lose', pace: 'moderate' })).toBe(-550)
    expect(dailyKcalAdjustment({ kind: 'gain', pace: 'slow' })).toBe(275)
    expect(dailyKcalAdjustment(MAINTAIN)).toBe(0)
  })
})

describe('adjustedDailyKcal', () => {
  it('lägger justeringen på uppskattningen', () => {
    expect(adjustedDailyKcal(2300, { kind: 'lose', pace: 'moderate' })).toBe(1750)
    expect(adjustedDailyKcal(2300, MAINTAIN)).toBe(2300)
  })
})

describe('suggestedSplit', () => {
  it.each(OBJECTIVE_KINDS)('ger en giltig fördelning för %s', (kind) => {
    expect(isValidSplit(suggestedSplit(kind))).toBe(true)
  })
  it('ger standardfördelningen när vikten ska behållas', () => {
    expect(suggestedSplit('maintain')).toEqual(DEFAULT_SPLIT)
  })
})

describe('isValidObjective', () => {
  it.each([{ kind: 'maintain' }, { kind: 'lose', pace: 'slow' }, { kind: 'build_muscle', pace: 'moderate' }])(
    'godkänner %o',
    (v) => {
      expect(isValidObjective(v)).toBe(true)
    },
  )
  it.each([null, 'lose', {}, { kind: 'lose' }, { kind: 'lose', pace: 'fast' }, { kind: 'maintain', pace: 'slow' }, { kind: 'bulk', pace: 'slow' }])(
    'avvisar %o',
    (v) => {
      expect(isValidObjective(v)).toBe(false)
    },
  )
})

describe('isCalculatedGoal', () => {
  const profile = { weightKg: 70, heightCm: 175, ageYears: 30, sex: 'male', activity: 'moderate' } as const

  it('känner igen ett mål som är uträknat från profilen', () => {
    // 1648,75 × 1,55 ≈ 2556
    expect(isCalculatedGoal({ kcal: 2556 }, profile)).toBe(true)
    expect(isCalculatedGoal({ kcal: 2006, objective: { kind: 'lose', pace: 'moderate' } }, profile)).toBe(true)
  })
  it('räknar ett eget kalorimål som angivet själv', () => {
    expect(isCalculatedGoal({ kcal: 2000 }, profile)).toBe(false)
  })
  it('kräver en profil', () => {
    expect(isCalculatedGoal({ kcal: 2556 }, null)).toBe(false)
  })
})
