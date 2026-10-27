import type { FoodSource } from './types'

/**
 * Livsmedels-id har källan som prefix, så att id:n från olika källor aldrig
 * krockar och så att buntade livsmedel kan kännas igen utan databasuppslag.
 */
const PREFIXES: Readonly<Record<FoodSource, string>> = { slv: 'slv:', off: 'off:', custom: 'custom:' }

export function slvFoodId(nummer: number): string {
  return `${PREFIXES.slv}${nummer}`
}

export function offFoodId(barcode: string): string {
  return `${PREFIXES.off}${barcode}`
}

export function customFoodId(uuid: string): string {
  return `${PREFIXES.custom}${uuid}`
}

/** Sant för Livsmedelsverkets livsmedel, som är buntade och inte ligger i databasen. */
export function isSlvFoodId(id: string): boolean {
  return id.startsWith(PREFIXES.slv)
}

/** Sant om id:t har prefixet för källan, till exempel custom: för egna livsmedel. */
export function idMatchesSource(id: string, source: FoodSource): boolean {
  return id.length > PREFIXES[source].length && id.startsWith(PREFIXES[source])
}
