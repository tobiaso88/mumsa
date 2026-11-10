import { copiedEntries, mealDays } from '../../../src/domain/nutrition/copyMeal'
import { makeEntry } from '../../helpers/testData'

describe('mealDays', () => {
  const entries = [
    makeEntry({ id: 'a', date: '2026-10-18', meal: 'breakfast', foodName: 'Gröt', grams: 100, createdAt: '2026-10-18T07:00:00.000Z' }),
    makeEntry({ id: 'b', date: '2026-10-19', meal: 'breakfast', foodName: 'Kaffe', grams: 100, createdAt: '2026-10-19T07:05:00.000Z' }),
    makeEntry({ id: 'c', date: '2026-10-19', meal: 'breakfast', foodName: 'Mackor', grams: 50, createdAt: '2026-10-19T07:00:00.000Z' }),
    makeEntry({ id: 'd', date: '2026-10-19', meal: 'lunch', foodName: 'Soppa' }),
  ]

  it('ger dagar med den valda måltiden, senaste först', () => {
    expect(mealDays(entries, 'breakfast').map((d) => d.date)).toEqual(['2026-10-19', '2026-10-18'])
  })

  it('hoppar över poster i andra måltider', () => {
    expect(mealDays(entries, 'lunch').map((d) => d.entries.map((e) => e.id))).toEqual([['d']])
  })

  it('lägger posterna i den ordning de loggades', () => {
    expect(mealDays(entries, 'breakfast')[0]?.entries.map((e) => e.id)).toEqual(['c', 'b'])
  })

  it('summerar kalorierna för dagens måltid', () => {
    // Havregryn: 370 kcal per 100 g, 100 g + 50 g
    expect(mealDays(entries, 'breakfast')[0]?.total.kcal).toBe(555)
  })

  it('ger en tom lista när måltiden inte är loggad någon dag', () => {
    expect(mealDays(entries, 'dinner')).toEqual([])
    expect(mealDays([], 'breakfast')).toEqual([])
  })
})

describe('copiedEntries', () => {
  const source = [makeEntry({ id: 'a', date: '2026-10-19', meal: 'lunch', foodId: 'slv:702', foodName: 'Havregryn', grams: 40 })]

  it('flyttar posterna till målets dag och måltid och behåller mängd och näring', () => {
    const [copy] = copiedEntries(source, { date: '2026-10-20', meal: 'breakfast' })
    expect(copy).toEqual({
      date: '2026-10-20',
      meal: 'breakfast',
      foodId: 'slv:702',
      foodName: 'Havregryn',
      grams: 40,
      per100g: source[0]!.per100g,
    })
  })

  it('tar inte med id eller tidpunkt från originalet', () => {
    const [copy] = copiedEntries(source, { date: '2026-10-20', meal: 'lunch' })
    expect(copy).not.toHaveProperty('id')
    expect(copy).not.toHaveProperty('createdAt')
  })

  it('delar inte näringsobjekt med originalet', () => {
    const [copy] = copiedEntries(source, { date: '2026-10-20', meal: 'lunch' })
    expect(copy!.per100g).not.toBe(source[0]!.per100g)
  })
})
