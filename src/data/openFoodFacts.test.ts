import { MAX_TEXT_LENGTH } from '../domain/foodValidation'
import productFixture from './fixtures/off-product.json'
import { getByBarcode, mapOffProduct, OffError } from './openFoodFacts'

const now = new Date('2026-10-23T10:00:00Z')

function mockFetch(response: Response | Error) {
  const fn = vi.fn<(url: string) => Promise<Response>>(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('mapOffProduct', () => {
  it('mappar en produkt med kcal och portion', () => {
    expect(mapOffProduct(productFixture.product, now)).toEqual({
      id: 'off:7310130321184',
      name: 'AXA Fiber havregryn',
      brand: 'AXA',
      barcode: '7310130321184',
      source: 'off',
      per100g: { kcal: 350, protein: 12, carbs: 69, fat: 7 },
      servingGrams: 100,
      servingLabel: '1 dl',
      updatedAt: '2026-10-23T10:00:00.000Z',
    })
  })

  it('räknar om kJ till kcal när kcal saknas', () => {
    const { 'energy-kcal_100g': _, ...nutriments } = productFixture.product.nutriments
    const food = mapOffProduct({ ...productFixture.product, nutriments }, now)
    expect(food?.per100g.kcal).toBeCloseTo(1500 / 4.184)
  })

  it('tar första varumärket ur en lista', () => {
    expect(mapOffProduct({ ...productFixture.product, brands: ['ICA', 'ICA Basic'] }, now)?.brand).toBe('ICA')
  })

  it('använder svenskt namn i första hand och första varumärket', () => {
    const food = mapOffProduct(
      { code: '1234567', product_name: 'Oat flakes', product_name_sv: 'Havregryn', brands: 'Kungsörnen, Lantmännen', nutriments: { 'energy-kcal_100g': 370, proteins_100g: 13, carbohydrates_100g: 59, fat_100g: '7,5' } },
      now,
    )
    expect(food).toMatchObject({ name: 'Havregryn', brand: 'Kungsörnen', per100g: { fat: 7.5 } })
    expect(food?.servingGrams).toBeUndefined()
  })

  it.each([
    ['namn', { product_name: '' }],
    ['streckkod', { code: undefined }],
    ['energi', { nutriments: { proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } }],
    ['protein', { nutriments: { 'energy-kcal_100g': 100, carbohydrates_100g: 1, fat_100g: 1 } }],
  ])('ger null när %s saknas', (_, override) => {
    expect(mapOffProduct({ ...productFixture.product, product_name_sv: undefined, ...override }, now)).toBeNull()
  })

  it.each([
    ['för hög energi', { 'energy-kcal_100g': 5000, proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 }],
    ['makron över 100 g', { 'energy-kcal_100g': 400, proteins_100g: 80, carbohydrates_100g: 80, fat_100g: 1 }],
  ])('ger null vid %s', (_, nutriments) => {
    expect(mapOffProduct({ ...productFixture.product, nutriments }, now)).toBeNull()
  })

  it('ger null när streckkoden inte är siffror', () => {
    expect(mapOffProduct({ ...productFixture.product, code: '../1234567' }, now)).toBeNull()
  })

  it('kortar långa texter', () => {
    const long = 'a'.repeat(MAX_TEXT_LENGTH + 50)
    const food = mapOffProduct({ ...productFixture.product, product_name_sv: long, brands: long, serving_size: long }, now)
    expect(food?.name).toHaveLength(MAX_TEXT_LENGTH)
    expect(food?.brand).toHaveLength(MAX_TEXT_LENGTH)
    expect(food?.servingLabel).toHaveLength(MAX_TEXT_LENGTH)
  })

  it('ignorerar orimligt stora portioner', () => {
    const food = mapOffProduct({ ...productFixture.product, serving_quantity: 1e9 }, now)
    expect(food?.servingGrams).toBeUndefined()
    expect(food?.servingLabel).toBeUndefined()
  })

  it('ignorerar portioner i andra enheter än gram och milliliter', () => {
    const food = mapOffProduct({ ...productFixture.product, serving_quantity_unit: 'st' }, now)
    expect(food?.servingGrams).toBeUndefined()
    expect(food?.servingLabel).toBeUndefined()
  })
})

describe('getByBarcode', () => {
  it('hämtar och mappar en produkt', async () => {
    const fetch = mockFetch(Response.json(productFixture))
    const food = await getByBarcode('7310130321184', undefined, now)
    expect(food?.id).toBe('off:7310130321184')
    expect(String(fetch.mock.calls[0]?.[0])).toMatch(/^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\/7310130321184\.json\?fields=/)
  })

  it('ger null för okänd produkt', async () => {
    mockFetch(Response.json({ status: 0, status_verbose: 'product not found' }, { status: 404 }))
    expect(await getByBarcode('7310000000001')).toBeNull()
  })

  it('anropar inte API:t för ogiltig streckkod', async () => {
    const fetch = mockFetch(Response.json({}))
    expect(await getByBarcode('abc')).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('ger OffError vid serverfel', async () => {
    mockFetch(new Response('', { status: 503 }))
    await expect(getByBarcode('7310130321184')).rejects.toMatchObject({ kind: 'http', status: 503 })
  })

  it('ger OffError vid nätverksfel', async () => {
    mockFetch(new TypeError('Failed to fetch'))
    const error = await getByBarcode('7310130321184').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(OffError)
    expect(error).toMatchObject({ kind: 'network' })
  })

  it('anropar inte API:t offline', async () => {
    const fetch = mockFetch(Response.json(productFixture))
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false)
    await expect(getByBarcode('7310130321184')).rejects.toMatchObject({ kind: 'offline' })
    expect(fetch).not.toHaveBeenCalled()
  })
})
