import { addDays, isIsoDate, isoWeekNumber, parseIsoDate, startOfWeek, toIsoDate, weekDates } from './dates'

describe('toIsoDate', () => {
  it('formaterar lokalt datum med nollutfyllnad', () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('isIsoDate', () => {
  it.each(['2026-10-23', '2024-02-29'])('godkänner %s', (v) => {
    expect(isIsoDate(v)).toBe(true)
  })
  it.each(['2026-13-01', '2025-02-29', '2026-1-1', '', 20261023, null])('avvisar %s', (v) => {
    expect(isIsoDate(v)).toBe(false)
  })
})

describe('parseIsoDate', () => {
  it('ger lokal midnatt', () => {
    const d = parseIsoDate('2026-10-23')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 23, 0])
  })
  it('kastar fel för ogiltigt datum', () => {
    expect(() => parseIsoDate('nej')).toThrow()
  })
})

describe('addDays', () => {
  it('går över månads- och årsskiften', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('påverkas inte av sommartid', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
  })
})

describe('startOfWeek', () => {
  it('ger måndagen i veckan', () => {
    expect(startOfWeek('2026-10-23')).toBe('2026-10-19') // fredag
    expect(startOfWeek('2026-10-19')).toBe('2026-10-19') // måndag
    expect(startOfWeek('2026-10-25')).toBe('2026-10-19') // söndag
  })
})

describe('weekDates', () => {
  it('ger sju dagar i följd', () => {
    expect(weekDates('2026-10-26')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ])
  })
})

describe('isoWeekNumber', () => {
  it.each([
    ['2026-10-23', 43],
    ['2026-01-01', 1], // torsdag
    ['2025-12-29', 1], // måndag i vecka 1 2026
    ['2027-01-01', 53], // fredag i vecka 53 2026
    ['2027-01-04', 1],
    ['2024-12-30', 1],
    ['2021-01-03', 53], // söndag i vecka 53 2020
  ])('%s ligger i vecka %i', (date, week) => {
    expect(isoWeekNumber(date)).toBe(week)
  })
})
