import { isValidBarcode } from '../domain/barcode'
import { offFoodId } from '../domain/foodIds'
import { MAX_TEXT_LENGTH, nutrientIssues } from '../domain/foodValidation'
import { isValidAmount } from '../domain/nutrition'
import type { Food, Nutrients } from '../domain/types'

const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'
const FIELDS = [
  'code',
  'product_name',
  'product_name_sv',
  'brands',
  'nutriments',
  'serving_quantity',
  'serving_quantity_unit',
  'serving_size',
].join(',')
const TIMEOUT_MS = 10_000
const KJ_PER_KCAL = 4.184

/** Produkt så som Open Food Facts returnerar den. Används bara i den här filen. */
type OffProduct = {
  code?: unknown
  product_name?: unknown
  product_name_sv?: unknown
  brands?: unknown
  nutriments?: Record<string, unknown>
  serving_quantity?: unknown
  serving_quantity_unit?: unknown
  serving_size?: unknown
}

export type OffErrorKind = 'offline' | 'timeout' | 'network' | 'http'

export class OffError extends Error {
  readonly kind: OffErrorKind
  readonly status?: number

  constructor(kind: OffErrorKind, message: string, status?: number) {
    super(message)
    this.name = 'OffError'
    this.kind = kind
    this.status = status
  }
}

function toNumber(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Produkterna redigeras av användare, så text kortas till samma längd som egna livsmedel får ha. */
function toText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim().slice(0, MAX_TEXT_LENGTH) : undefined
}

function firstBrand(brands: unknown): string | undefined {
  const first = Array.isArray(brands) ? brands[0] : typeof brands === 'string' ? brands.split(',')[0] : undefined
  return toText(first)
}

function kcalPer100g(n: Record<string, unknown>): number | undefined {
  const kcal = toNumber(n['energy-kcal_100g'])
  if (kcal !== undefined) return kcal
  const kj = toNumber(n['energy-kj_100g']) ?? toNumber(n['energy_100g'])
  return kj === undefined ? undefined : kj / KJ_PER_KCAL
}

/**
 * Mappar en produkt från Open Food Facts till ett livsmedel. Produkter som
 * saknar namn, giltig streckkod eller något av energi, protein, kolhydrater
 * och fett, eller har omöjliga näringsvärden, ger null eftersom de inte går
 * att logga korrekt.
 */
export function mapOffProduct(raw: OffProduct, now: Date): Food | null {
  const barcode = toText(raw.code)
  const name = toText(raw.product_name_sv) ?? toText(raw.product_name)
  const n = raw.nutriments ?? {}
  const kcal = kcalPer100g(n)
  const protein = toNumber(n.proteins_100g)
  const carbs = toNumber(n.carbohydrates_100g)
  const fat = toNumber(n.fat_100g)
  if (!barcode || !isValidBarcode(barcode) || !name || kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) {
    return null
  }
  const per100g: Nutrients = { kcal, protein, carbs, fat }
  if (nutrientIssues(per100g).length > 0) return null
  const unit = toText(raw.serving_quantity_unit)
  const quantity = unit === undefined || unit === 'g' || unit === 'ml' ? toNumber(raw.serving_quantity) : undefined
  const servingGrams = quantity !== undefined && isValidAmount(quantity) ? quantity : undefined
  return {
    id: offFoodId(barcode),
    name,
    brand: firstBrand(raw.brands),
    barcode,
    source: 'off',
    per100g,
    servingGrams,
    servingLabel: servingGrams ? toText(raw.serving_size) : undefined,
    updatedAt: now.toISOString(),
  }
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new OffError('offline', 'Du är offline.')
  }
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
  } catch (error) {
    if (signal?.aborted) throw error
    if (timeout.aborted) throw new OffError('timeout', 'Open Food Facts svarade inte i tid.')
    throw new OffError('network', 'Kunde inte nå Open Food Facts.')
  }
  if (!response.ok) {
    throw new OffError('http', `Open Food Facts svarade med fel ${response.status}.`, response.status)
  }
  return response.json()
}

/** Slår upp en streckkod. Ger null om produkten saknas eller inte går att logga. */
export async function getByBarcode(barcode: string, signal?: AbortSignal, now = new Date()): Promise<Food | null> {
  if (!isValidBarcode(barcode)) return null
  const url = `${PRODUCT_URL}/${barcode}.json?fields=${FIELDS}`
  let body: unknown
  try {
    body = await getJson(url, signal)
  } catch (error) {
    // Okänd streckkod ger 404 från API:t
    if (error instanceof OffError && error.status === 404) return null
    throw error
  }
  const product = (body as { status?: unknown; product?: OffProduct }).product
  if ((body as { status?: unknown }).status !== 1 || !product) return null
  return mapOffProduct({ ...product, code: product.code ?? barcode }, now)
}
