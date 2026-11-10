import { addEntries, addEntry, deleteEntry, updateEntry, type EntryChanges, type NewEntry } from '../../data/repos/entriesRepo'
import { useDb } from '../dbContext'

/** Skrivningar för loggposter, bundna till appens databas. */
export function useEntryActions() {
  const db = useDb()
  return {
    add: (input: NewEntry) => addEntry(db, input),
    addMany: (inputs: readonly NewEntry[]) => addEntries(db, inputs),
    update: (id: string, changes: EntryChanges) => updateEntry(db, id, changes),
    remove: (id: string) => deleteEntry(db, id),
  }
}
