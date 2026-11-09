import { exportAll } from '../../data/backup/backup'
import { canShareExport, downloadExport, shareExport, type ShareResult } from '../../data/backup/backupFile'
import { useDb } from '../dbContext'

/** Exporterar all data, antingen som en fil på enheten eller via systemets delningsmeny. */
export function useExport() {
  const db = useDb()
  return {
    canShare: canShareExport(),
    download: async () => downloadExport(await exportAll(db)),
    share: async (): Promise<ShareResult> => shareExport(await exportAll(db)),
  }
}
