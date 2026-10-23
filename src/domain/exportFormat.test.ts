import { createExport, validateImport } from './exportFormat'
import { makeEntry, makeFood } from './testData'

const valid = createExport(
  {
    foods: [makeFood(), makeFood({ id: 'food-2', source: 'off', barcode: '7310865004703', servingGrams: 30 })],
    entries: [makeEntry()],
    goals: { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } },
    profile: { weightKg: 70, heightCm: 175, ageYears: 30, sex: 'female', activity: 'light' },
  },
  new Date('2026-10-23T10:00:00Z'),
)

describe('createExport', () => {
  it('sätter app, version och tidpunkt', () => {
    expect(valid).toMatchObject({ app: 'mumsa', version: 1, exportedAt: '2026-10-23T10:00:00.000Z' })
  })
})

describe('validateImport', () => {
  it('godkänner en export efter JSON-rundresa', () => {
    const result = validateImport(JSON.parse(JSON.stringify(valid)))
    expect(result).toEqual({ ok: true, data: valid })
  })

  it('godkänner export utan mål och profil', () => {
    const result = validateImport({ ...valid, goals: null, profile: undefined })
    expect(result.ok && result.data.goals === null && result.data.profile === null).toBe(true)
  })

  it.each([
    ['annan app', { ...valid, app: 'annan' }, 'inte en export från Mumsa'],
    ['inget objekt', 'hej', 'inte en export från Mumsa'],
    ['okänd version', { ...valid, version: 2 }, 'Exportversion 2'],
    ['saknade listor', { ...valid, foods: undefined }, 'saknar livsmedel'],
    ['ogiltigt livsmedel', { ...valid, foods: [makeFood(), { id: 'x' }] }, 'Livsmedel nummer 2'],
    ['negativ näring', { ...valid, foods: [makeFood({ per100g: { kcal: -1, protein: 0, carbs: 0, fat: 0 } })] }, 'Livsmedel nummer 1'],
    ['ogiltigt datum', { ...valid, entries: [makeEntry({ date: '2026-02-30' })] }, 'Loggpost nummer 1'],
    ['okänd måltid', { ...valid, entries: [{ ...makeEntry(), meal: 'brunch' }] }, 'Loggpost nummer 1'],
    ['noll gram', { ...valid, entries: [makeEntry({ grams: 0 })] }, 'Loggpost nummer 1'],
    ['fel makrosumma', { ...valid, goals: { kcal: 2000, split: { proteinPct: 50, carbsPct: 50, fatPct: 50 } } }, 'Målen'],
    ['orimlig profil', { ...valid, profile: { ...valid.profile, ageYears: 5 } }, 'Profilen'],
  ])('avvisar %s', (_, input, message) => {
    const result = validateImport(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(message)
  })
})
