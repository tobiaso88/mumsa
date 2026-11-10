import { QUICK_FOOD_ID } from '../../../src/domain/foods/foodIds'
import { entryNutrients, MAX_ENTRY_GRAMS } from '../../../src/domain/nutrition/nutrition'
import {
  isQuickEntry,
  isValidQuickKcal,
  MAX_QUICK_KCAL,
  QUICK_ENTRY_NAME,
  quickEntryInput,
  quickEntryKcal,
} from '../../../src/domain/nutrition/quickEntry'
import { makeEntry } from '../../helpers/testData'

describe('quickEntryInput', () => {
  it('ger en post vars näring är exakt de angivna kalorierna', () => {
    const input = quickEntryInput('2026-10-20', 'lunch', 650, 'Pizza')
    expect(input).toMatchObject({ date: '2026-10-20', meal: 'lunch', foodId: QUICK_FOOD_ID, foodName: 'Pizza' })
    expect(entryNutrients(input)).toEqual({ kcal: 650, protein: 0, carbs: 0, fat: 0 })
  })

  it('använder standardnamnet när namnet saknas eller bara är blanksteg', () => {
    expect(quickEntryInput('2026-10-20', 'lunch', 100).foodName).toBe(QUICK_ENTRY_NAME)
    expect(quickEntryInput('2026-10-20', 'lunch', 100, '  ').foodName).toBe(QUICK_ENTRY_NAME)
  })

  it('tar bort blanksteg runt namnet', () => {
    expect(quickEntryInput('2026-10-20', 'lunch', 100, ' Pizza ').foodName).toBe('Pizza')
  })

  it('kan ge fler kalorier än ett livsmedel kan ha per 100 g', () => {
    expect(entryNutrients(quickEntryInput('2026-10-20', 'dinner', 1800)).kcal).toBe(1800)
  })

  it('går att läsa tillbaka som kalorier', () => {
    const input = quickEntryInput('2026-10-20', 'lunch', 420)
    expect(isQuickEntry(input)).toBe(true)
    expect(quickEntryKcal(input)).toBe(420)
  })
})

it('skiljer snabbregistreringar från vanliga poster', () => {
  expect(isQuickEntry(makeEntry())).toBe(false)
})

describe('isValidQuickKcal', () => {
  it.each([1, 450, 0.5, MAX_QUICK_KCAL])('godkänner %s', (kcal) => expect(isValidQuickKcal(kcal)).toBe(true))
  it.each([0, -5, MAX_QUICK_KCAL + 1, NaN, Infinity, null])('avvisar %s', (kcal) => expect(isValidQuickKcal(kcal)).toBe(false))

  it('har samma gräns som en vanlig post, så att en export går att läsa in igen', () => {
    expect(MAX_QUICK_KCAL).toBe(MAX_ENTRY_GRAMS)
  })
})
