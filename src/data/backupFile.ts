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

export type JsonFileResult = { ok: true; json: unknown } | { ok: false }

/** Läser en vald fil som JSON. ok är falskt om filen inte går att läsa eller inte är giltig JSON. */
export async function readJsonFile(file: File): Promise<JsonFileResult> {
  try {
    return { ok: true, json: JSON.parse(await file.text()) as unknown }
  } catch {
    return { ok: false }
  }
}
