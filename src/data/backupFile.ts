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

/** Läser en vald fil som JSON. Ger null om filen inte är giltig JSON. */
export async function readJsonFile(file: File): Promise<unknown> {
  try {
    return JSON.parse(await file.text()) as unknown
  } catch {
    return null
  }
}
