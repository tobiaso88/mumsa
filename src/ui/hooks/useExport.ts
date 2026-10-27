import { exportAll } from '../../data/backup'
import { downloadExport } from '../../data/backupFile'
import { useDb } from '../dbContext'

/** Exporterar all data och sparar den som en fil på enheten. */
export function useExport() {
  const db = useDb()
  return async () => downloadExport(await exportAll(db))
}
