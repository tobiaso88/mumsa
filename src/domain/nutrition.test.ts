import {
  addNutrients,
  entryNutrients,
  nutrientsForAmount,
  portionsToGrams,
  scaleNutrients,
  sumNutrients,
  ZERO_NUTRIENTS,
} from './nutrition'
import { makeEntry } from './testData'

const oats = { kcal: 370, protein: 13, carbs: 59, fat: 7 }

describe('nutrientsForAmount', () => {
  it('räknar om från per 100 g', () => {
    expect(nutrientsForAmount(oats, 40)).toEqual({
      kcal: expect.closeTo(148),
      protein: expect.closeTo(5.2),
      carbs: expect.closeTo(23.6),
      fat: expect.closeTo(2.8),
    })
  })
  it('ger noll för noll gram', () => {
    expect(nutrientsForAmount(oats, 0)).toEqual(ZERO_NUTRIENTS)
  })
  it('avrundar inte', () => {
    expect(nutrientsForAmount({ kcal: 100, protein: 0, carbs: 0, fat: 0 }, 33).kcal).toBeCloseTo(33)
    expect(nutrientsForAmount({ kcal: 1, protein: 0, carbs: 0, fat: 0 }, 1).kcal).toBe(0.01)
  })
})

describe('addNutrients, sumNutrients och scaleNutrients', () => {
  it('adderar fältvis', () => {
    expect(addNutrients(oats, oats)).toEqual({ kcal: 740, protein: 26, carbs: 118, fat: 14 })
  })
  it('summerar en tom lista till noll', () => {
    expect(sumNutrients([])).toEqual(ZERO_NUTRIENTS)
  })
  it('ändrar inte nollkonstanten', () => {
    sumNutrients([oats])
    expect(ZERO_NUTRIENTS).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
  })
  it('skalar alla fält', () => {
    expect(scaleNutrients(oats, 0.5)).toEqual({ kcal: 185, protein: 6.5, carbs: 29.5, fat: 3.5 })
  })
})

describe('portionsToGrams', () => {
  it('räknar om portioner till gram', () => {
    expect(portionsToGrams({ servingGrams: 30 }, 1.5)).toBe(45)
  })
  it('ger null utan portionsstorlek', () => {
    expect(portionsToGrams({}, 2)).toBeNull()
    expect(portionsToGrams({ servingGrams: 0 }, 2)).toBeNull()
  })
})

describe('entryNutrients', () => {
  it('använder postens sparade näring och mängd', () => {
    expect(entryNutrients(makeEntry({ grams: 50 })).kcal).toBe(185)
  })
})
