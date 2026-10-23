import { formatDayTitle, formatNumber, formatShortDate, formatWeekdayShort, parseNumber, toInputText } from './format'

describe('parseNumber', () => {
  it.each([
    ['72,5', 72.5],
    [' 180 ', 180],
    ['0.5', 0.5],
  ])('tolkar %s', (text, value) => {
    expect(parseNumber(text)).toBe(value)
  })
  it.each(['', '  ', 'abc'])('ger NaN för "%s"', (text) => {
    expect(parseNumber(text)).toBeNaN()
  })
})

describe('formatNumber', () => {
  it('avrundar med svenskt decimaltecken', () => {
    expect(formatNumber(1648.75)).toBe('1 649')
    expect(formatNumber(2.25, 1)).toBe('2,3')
  })
})

describe('formatDayTitle', () => {
  it('ger veckodag, dag och månad på svenska', () => {
    expect(formatDayTitle('2026-10-23')).toBe('fredag 23 oktober')
  })
})

describe('toInputText', () => {
  it('använder decimalkomma och går att tolka tillbaka', () => {
    expect(toInputText(72.5)).toBe('72,5')
    expect(parseNumber(toInputText(72.5))).toBe(72.5)
    expect(toInputText(undefined)).toBe('')
  })
})

describe('formatShortDate och formatWeekdayShort', () => {
  it('ger korta svenska format utan punkt', () => {
    expect(formatShortDate('2026-10-19')).toBe('19 okt')
    expect(formatWeekdayShort('2026-10-19')).toBe('mån')
  })
})
