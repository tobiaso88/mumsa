import { toIsoDate } from '../../domain/dates'
import type { ExportData } from '../../domain/backup/exportFormat'

export function exportFileName(now: Date): string {
  return `mumsa-backup-${toIsoDate(now)}.json`
}

function exportBlobParts(data: ExportData): BlobPart[] {
  return [JSON.stringify(data, null, 2)]
}

/** Sparar exporten som en fil på enheten. Inget skickas över nätverket. */
export function downloadExport(data: ExportData, now = new Date()): void {
  const blob = new Blob(exportBlobParts(data), { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFileName(now)
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Om webbläsaren kan dela en JSON-fil via systemets delningsmeny (Filer/iCloud Drive på iOS, Drive m.fl. på Android). */
export function canShareExport(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function' || typeof navigator.share !== 'function') return false
  return navigator.canShare({ files: [new File(['{}'], 'mumsa-backup.json', { type: 'application/json' })] })
}

export type ShareResult = 'shared' | 'cancelled'

/**
 * Öppnar systemets delningsmeny med exporten som fil, så att användaren kan
 * välja Spara i Filer, iCloud Drive eller Google Drive. Appen skickar själv
 * ingenting över nätverket. Om användaren stänger menyn blir resultatet
 * 'cancelled' och inte ett fel.
 */
export async function shareExport(data: ExportData, now = new Date()): Promise<ShareResult> {
  const file = new File(exportBlobParts(data), exportFileName(now), { type: 'application/json' })
  try {
    await navigator.share({ files: [file], title: 'Mumsa säkerhetskopia' })
    return 'shared'
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    throw e
  }
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
