import { addEntry, deleteEntry, updateEntry, type EntryChanges, type NewEntry } from '../../data/entriesRepo'
import { useDb } from '../dbContext'

/** Skrivningar för loggposter, bundna till appens databas. */
export function useEntryActions() {
  const db = useDb()
  return {
    add: (input: NewEntry) => addEntry(db, input),
    update: (id: string, changes: EntryChanges) => updateEntry(db, id, changes),
    remove: (id: string) => deleteEntry(db, id),
  }
}
