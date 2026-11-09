import type { WeightEntry } from './types'
import { isValidWeightKg, weeklyChange, weightProgress, weightsInRange } from './weight'

const w = (date: string, kg: number): WeightEntry => ({ date, kg, createdAt: `${date}T08:00:00.000Z` })

describe('isValidWeightKg', () => {
  it.each([0.5, 72.4, 499])('godkänner %s', (kg) => {
    expect(isValidWeightKg(kg)).toBe(true)
  })
  it.each([0, -1, 500, NaN, Infinity])('avvisar %s', (kg) => {
    expect(isValidWeightKg(kg)).toBe(false)
  })
})

describe('weightProgress', () => {
  it('ger null utan vägningar', () => {
    expect(weightProgress([], 70)).toBeNull()
  })
  it('räknar förändring från första vägningen oavsett ordning', () => {
    const p = weightProgress([w('2026-10-15', 78), w('2026-10-01', 80)])
    expect(p).toMatchObject({ start: { kg: 80 }, latest: { kg: 78 }, changeKg: -2, leftKg: null, reached: null })
  })
  it('räknar kvar till målvikten vid viktnedgång', () => {
    const p = weightProgress([w('2026-10-01', 80), w('2026-10-15', 78)], 75)
    expect(p).toMatchObject({ leftKg: -3, reached: false })
  })
  it('är nådd när vikten passerat målet i rätt riktning', () => {
    expect(weightProgress([w('2026-10-01', 80), w('2026-10-15', 74.5)], 75)?.reached).toBe(true)
    expect(weightProgress([w('2026-10-01', 60), w('2026-10-15', 62)], 62)?.reached).toBe(true)
    expect(weightProgress([w('2026-10-01', 60), w('2026-10-15', 61)], 62)?.reached).toBe(false)
  })
  it('är nådd först på exakt målvikt om man började där', () => {
    expect(weightProgress([w('2026-10-01', 70)], 70)?.reached).toBe(true)
    expect(weightProgress([w('2026-10-01', 70), w('2026-10-02', 71)], 70)?.reached).toBe(false)
  })
})

describe('weeklyChange', () => {
  it('ger snittet per vecka under perioden', () => {
    const entries = [w('2026-10-01', 80), w('2026-10-15', 79), w('2026-10-29', 78)]
    expect(weeklyChange(entries, '2026-10-29')).toBeCloseTo(-0.5)
  })
  it('bortser från vägningar före perioden', () => {
    const entries = [w('2026-08-01', 90), w('2026-10-15', 79), w('2026-10-29', 78)]
    expect(weeklyChange(entries, '2026-10-29')).toBeCloseTo(-0.5)
  })
  it('ger null när vägningarna ligger mindre än en vecka isär', () => {
    expect(weeklyChange([w('2026-10-25', 80), w('2026-10-29', 79)], '2026-10-29')).toBeNull()
    expect(weeklyChange([], '2026-10-29')).toBeNull()
  })
})

describe('weightsInRange', () => {
  it('tar med gränserna och sorterar äldst först', () => {
    const entries = [w('2026-10-10', 1), w('2026-10-01', 2), w('2026-09-30', 3), w('2026-10-11', 4)]
    expect(weightsInRange(entries, '2026-10-01', '2026-10-10').map((e) => e.date)).toEqual(['2026-10-01', '2026-10-10'])
  })
})
