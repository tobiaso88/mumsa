/** EAN-8, EAN-13, UPC och liknande koder på livsmedelsförpackningar. */
const BARCODE = /^\d{6,14}$/

/** Tar bort blanksteg, som ofta följer med när en kod skrivs in för hand. */
export function normalizeBarcode(text: string): string {
  return text.replace(/\s/g, '')
}

export function isValidBarcode(code: string): boolean {
  return BARCODE.test(code)
}
