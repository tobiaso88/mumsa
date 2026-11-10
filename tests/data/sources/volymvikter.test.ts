import { isValidMeasures } from '../../../src/domain/foods/measures'
import { slvFoodId } from '../../../src/domain/foods/foodIds'
import data from '../../../src/data/sources/volymvikter.json'
import slvData from '../../../src/data/sources/livsmedelsverket.json'
import { loadSlvFoods } from '../../../src/data/sources/livsmedelsverket'
import { measuresByNummer, SLV_MEASURE_LINKS, type VolymvikterDataset } from '../../../src/data/sources/volymvikter'

const dataset = data as unknown as VolymvikterDataset

// Kontrollerar den buntade filen med hushållsmått och kopplingarna till livsmedelsdatabasen
describe('hushållsmått från Livsmedelsverket', () => {
  it('anger källan', () => {
    expect(dataset.source).toBe('Livsmedelsverket')
    expect(dataset.title).toBe('Volymvikter, viktförändringsfaktorer och avfall')
    expect(dataset.url).toMatch(/^https:\/\/www\.livsmedelsverket\.se\//)
  })

  it('har giltiga mått med unika namn', () => {
    expect(dataset.rows.length).toBeGreaterThan(200)
    expect(new Set(dataset.rows.map(([name]) => name)).size).toBe(dataset.rows.length)
    for (const [name, measures] of dataset.rows) {
      expect(isValidMeasures(measures), name).toBe(true)
    }
  })

  it('kopplar bara till namn som finns i rapporten och nummer som finns i databasen', () => {
    const names = new Set(dataset.rows.map(([name]) => name))
    const numbers = new Set(slvData.rows.map((row) => row[0]))
    for (const [nummer, name] of Object.entries(SLV_MEASURE_LINKS)) {
      expect(names.has(name), name).toBe(true)
      expect(numbers.has(Number(nummer)), nummer).toBe(true)
    }
    expect(measuresByNummer(dataset).size).toBe(Object.keys(SLV_MEASURE_LINKS).length)
  })

  it('ger havregryn rapportens mått men inte havregrynsgröt eller fiberhavregryn', async () => {
    const foods = await loadSlvFoods()
    const byId = (nummer: number) => foods.find((f) => f.id === slvFoodId(nummer))
    expect(byId(702)).toMatchObject({ name: 'Havregryn fullkorn', measures: { dl: 39, msk: 6 } })
    expect(byId(677)?.measures).toBeUndefined()
    expect(byId(703)?.measures).toBeUndefined()
  })
})
