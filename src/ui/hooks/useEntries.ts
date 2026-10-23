import { getEntriesForDate, getEntriesInRange } from '../../data/entriesRepo'
import { addDays } from '../../domain/dates'
import type { IsoDate, LogEntry } from '../../domain/types'
import { useDb } from '../dbContext'
import { useLiveQuery } from './useLiveQuery'

export function useDayEntries(date: IsoDate): LogEntry[] | undefined {
  const db = useDb()
  return useLiveQuery(() => getEntriesForDate(db, date), [db, date])
}

/** Alla poster i de sju dagarna från weekStart. */
export function useWeekEntries(weekStart: IsoDate): LogEntry[] | undefined {
  const db = useDb()
  return useLiveQuery(() => getEntriesInRange(db, weekStart, addDays(weekStart, 6)), [db, weekStart])
}
