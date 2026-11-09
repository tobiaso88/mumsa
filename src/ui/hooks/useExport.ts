import { exportAll } from '../../data/backup/backup'
import { downloadExport } from '../../data/backup/backupFile'
import { useDb } from '../dbContext'

/** Exporterar all data och sparar den som en fil på enheten. */
export function useExport() {
  const db = useDb()
  return async () => downloadExport(await exportAll(db))
}
