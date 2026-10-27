import { isValidBarcode, normalizeBarcode } from './barcode'

describe('normalizeBarcode', () => {
  it('tar bort blanksteg', () => {
    expect(normalizeBarcode(' 7310 8650 0001 8 ')).toBe('7310865000018')
  })
})

describe('isValidBarcode', () => {
  it('godkänner 6–14 siffror', () => {
    expect(isValidBarcode('123456')).toBe(true)
    expect(isValidBarcode('7310865000018')).toBe(true)
    expect(isValidBarcode('12345678901234')).toBe(true)
  })
  it('avvisar för korta, för långa och icke-numeriska koder', () => {
    expect(isValidBarcode('12345')).toBe(false)
    expect(isValidBarcode('123456789012345')).toBe(false)
    expect(isValidBarcode('73108650000a8')).toBe(false)
    expect(isValidBarcode('')).toBe(false)
  })
  it('kräver att koden är normaliserad', () => {
    expect(isValidBarcode('7310 8650')).toBe(false)
  })
})
