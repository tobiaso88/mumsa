import { kcalFromMacros, kcalLooksOff, MAX_KCAL_PER_100G, MAX_MACROS_PER_100G, nutrientIssues } from './foodValidation'

const oats = { kcal: 375, protein: 9.5, carbs: 64.1, fat: 7 }

describe('nutrientIssues', () => {
  it('godkänner rimliga värden', () => {
    expect(nutrientIssues(oats)).toEqual([])
    expect(nutrientIssues({ kcal: 902, protein: 0, carbs: 0, fat: 102 })).toEqual([])
  })
  it('hittar negativa och saknade värden', () => {
    expect(nutrientIssues({ ...oats, fat: -1 })).toEqual(['negative'])
    expect(nutrientIssues({ ...oats, kcal: NaN })).toEqual(['negative'])
  })
  it('hittar makron över 100 g och för hög energi', () => {
    expect(nutrientIssues({ kcal: 1200, protein: 50, carbs: 50, fat: 50 })).toEqual(['macrosOver100', 'kcalTooHigh'])
  })
  it('godkänner exakt gränsvärdena', () => {
    expect(nutrientIssues({ kcal: MAX_KCAL_PER_100G, protein: 0, carbs: 0, fat: MAX_MACROS_PER_100G })).toEqual([])
  })
})

describe('kcalFromMacros och kcalLooksOff', () => {
  it('räknar 4/4/9 kcal per gram', () => {
    expect(kcalFromMacros({ protein: 10, carbs: 10, fat: 10 })).toBe(170)
  })
  it('varnar bara vid stora avvikelser', () => {
    expect(kcalLooksOff(oats)).toBe(false)
    expect(kcalLooksOff({ ...oats, kcal: 37.5 })).toBe(true)
    expect(kcalLooksOff({ kcal: 30, protein: 0, carbs: 0, fat: 0 })).toBe(false)
  })
})
