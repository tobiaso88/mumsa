import { getEntriesForDate } from '../../data/entriesRepo'
import type { IsoDate, LogEntry } from '../../domain/types'
import { useDb } from '../dbContext'
import { useLiveQuery } from './useLiveQuery'

export function useDayEntries(date: IsoDate): LogEntry[] | undefined {
  const db = useDb()
  return useLiveQuery(() => getEntriesForDate(db, date), [db, date])
}
