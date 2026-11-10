import {
  amountUnits,
  availableMeasures,
  isValidGramsPerDl,
  isValidMeasures,
  MAX_GRAMS_PER_DL,
  measureGrams,
  unitGrams,
} from '../../../src/domain/foods/measures'

// Havregryn enligt Livsmedelsverkets rapport: 1 dl ≈ 39 g och 1 msk ≈ 6 g
const oats = { dl: 39, msk: 6 }

describe('measureGrams', () => {
  it('använder uppmätta värden i första hand', () => {
    expect(measureGrams(oats, 'dl')).toBe(39)
    expect(measureGrams(oats, 'msk')).toBe(6)
  })

  it('räknar fram msk och tsk från dl när de inte är uppmätta', () => {
    expect(measureGrams(oats, 'tsk')).toBeCloseTo(1.95)
    expect(measureGrams({ dl: 100 }, 'msk')).toBe(15)
  })

  it('räknar aldrig fram dl eller styck', () => {
    expect(measureGrams({ msk: 18, tsk: 6 }, 'dl')).toBeNull()
    expect(measureGrams(oats, 'st')).toBeNull()
    expect(measureGrams({ st: 20 }, 'st')).toBe(20)
  })

  it('ger null utan mått', () => {
    expect(measureGrams(undefined, 'dl')).toBeNull()
    expect(measureGrams({}, 'msk')).toBeNull()
  })
})

describe('availableMeasures', () => {
  it('listar måtten i fast ordning', () => {
    expect(availableMeasures(oats)).toEqual(['dl', 'msk', 'tsk'])
    expect(availableMeasures({ st: 20 })).toEqual(['st'])
    expect(availableMeasures({ tsk: 6, msk: 18 })).toEqual(['msk', 'tsk'])
    expect(availableMeasures(undefined)).toEqual([])
  })
})

describe('unitGrams', () => {
  it('ger gram per enhet', () => {
    expect(unitGrams({}, 'g')).toBe(1)
    expect(unitGrams({ servingGrams: 30 }, 'portion')).toBe(30)
    expect(unitGrams({ measures: oats }, 'dl')).toBe(39)
  })

  it('ger null för enheter som saknas', () => {
    expect(unitGrams({}, 'portion')).toBeNull()
    expect(unitGrams({}, 'dl')).toBeNull()
  })
})

describe('amountUnits', () => {
  it('har alltid gram, sedan mått och sist portion', () => {
    expect(amountUnits({})).toEqual(['g'])
    expect(amountUnits({ servingGrams: 30 })).toEqual(['g', 'portion'])
    expect(amountUnits({ servingGrams: 30, measures: oats })).toEqual(['g', 'dl', 'msk', 'tsk', 'portion'])
  })
})

describe('isValidGramsPerDl', () => {
  it('godtar rimliga vikter', () => {
    expect(isValidGramsPerDl(39)).toBe(true)
    expect(isValidGramsPerDl(MAX_GRAMS_PER_DL)).toBe(true)
  })

  it('stoppar noll, negativa och orimligt tunga vikter', () => {
    expect(isValidGramsPerDl(0)).toBe(false)
    expect(isValidGramsPerDl(-5)).toBe(false)
    expect(isValidGramsPerDl(MAX_GRAMS_PER_DL + 1)).toBe(false)
    expect(isValidGramsPerDl(NaN)).toBe(false)
  })
})

describe('isValidMeasures', () => {
  it('godtar kända mått med rimliga vikter', () => {
    expect(isValidMeasures(oats)).toBe(true)
    expect(isValidMeasures({ st: 229 })).toBe(true)
    expect(isValidMeasures({ tsk: 7, msk: 20, dl: 120 })).toBe(true)
  })

  it.each([
    ['inget objekt', 39],
    ['null', null],
    ['en lista', [39]],
    ['tomt objekt', {}],
    ['okänt mått', { kopp: 100 }],
    ['text', { dl: '39' }],
    ['noll', { dl: 0 }],
    ['för tung matsked', { msk: 50 }],
    ['för tungt styck', { st: 1e9 }],
  ])('stoppar %s', (_, value) => {
    expect(isValidMeasures(value)).toBe(false)
  })
})
