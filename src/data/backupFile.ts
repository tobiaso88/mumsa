import { toIsoDate } from '../domain/dates'
import type { ExportData } from '../domain/exportFormat'

export function exportFileName(now: Date): string {
  return `mumsa-backup-${toIsoDate(now)}.json`
}

/** Sparar exporten som en fil på enheten. Inget skickas över nätverket. */
export function downloadExport(data: ExportData, now = new Date()): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(now)
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Flera års loggning ryms på några megabyte. Större filer läses inte, så att fliken inte fryser. */
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024

export type JsonFileResult = { ok: true; json: unknown } | { ok: false; reason: 'tooLarge' | 'invalid' }

/** Läser en vald fil som JSON. ok är falskt om filen är för stor, inte går att läsa eller inte är giltig JSON. */
export async function readJsonFile(file: File, maxBytes = MAX_IMPORT_BYTES): Promise<JsonFileResult> {
  if (file.size > maxBytes) return { ok: false, reason: 'tooLarge' }
  try {
    return { ok: true, json: JSON.parse(await file.text()) as unknown }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}
