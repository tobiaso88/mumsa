import { summarizeDay, summarizeWeek } from './summary'
import { makeEntry } from './testData'

const per100g = { kcal: 200, protein: 10, carbs: 20, fat: 5 }

describe('summarizeDay', () => {
  it('ger nollor för en tom dag', () => {
    const s = summarizeDay([])
    expect(s.total.kcal).toBe(0)
    expect(Object.keys(s.byMeal)).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
  })

  it('summerar per måltid och totalt', () => {
    const s = summarizeDay([
      makeEntry({ id: 'a', meal: 'breakfast', grams: 100, per100g }),
      makeEntry({ id: 'b', meal: 'breakfast', grams: 50, per100g }),
      makeEntry({ id: 'c', meal: 'dinner', grams: 200, per100g }),
    ])
    expect(s.byMeal.breakfast).toEqual({ kcal: 300, protein: 15, carbs: 30, fat: 7.5 })
    expect(s.byMeal.lunch.kcal).toBe(0)
    expect(s.byMeal.dinner.kcal).toBe(400)
    expect(s.total).toEqual({ kcal: 700, protein: 35, carbs: 70, fat: 17.5 })
  })
})

describe('summarizeWeek', () => {
  const entries = [
    makeEntry({ id: 'a', date: '2026-10-19', grams: 1000, per100g }), // 2000 kcal
    makeEntry({ id: 'b', date: '2026-10-21', grams: 500, per100g }), // 1000 kcal
    makeEntry({ id: 'c', date: '2026-10-26', grams: 100, per100g }), // nästa vecka
    makeEntry({ id: 'd', date: '2026-10-18', grams: 100, per100g }), // förra veckan
  ]

  it('ger en total per dag för veckans sju dagar', () => {
    const s = summarizeWeek(entries, '2026-10-19')
    expect(s.days.map((d) => d.date)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
    expect(s.days.map((d) => d.total.kcal)).toEqual([2000, 0, 1000, 0, 0, 0, 0])
  })

  it('räknar snitt bara över loggade dagar', () => {
    const s = summarizeWeek(entries, '2026-10-19')
    expect(s.loggedDays).toBe(2)
    expect(s.average.kcal).toBe(1500)
  })

  it('ger nollsnitt för en tom vecka', () => {
    const s = summarizeWeek([], '2026-10-19')
    expect(s.loggedDays).toBe(0)
    expect(s.average).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
})
