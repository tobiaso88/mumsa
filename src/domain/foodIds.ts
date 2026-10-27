/**
 * Livsmedels-id har källan som prefix, så att id:n från olika källor aldrig
 * krockar och så att buntade livsmedel kan kännas igen utan databasuppslag.
 */
const SLV_PREFIX = 'slv:'

export function slvFoodId(nummer: number): string {
  return `${SLV_PREFIX}${nummer}`
}

export function offFoodId(barcode: string): string {
  return `off:${barcode}`
}

export function customFoodId(uuid: string): string {
  return `custom:${uuid}`
}

/** Sant för Livsmedelsverkets livsmedel, som är buntade och inte ligger i databasen. */
export function isSlvFoodId(id: string): boolean {
  return id.startsWith(SLV_PREFIX)
}
