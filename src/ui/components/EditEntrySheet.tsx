import { deleteEntry, updateEntry } from '../../data/entriesRepo'
import type { LogEntry } from '../../domain/types'
import { useDb } from '../dbContext'
import { AmountForm } from './AmountForm'
import { Sheet } from './Sheet'

/** Ändra mängd eller måltid för en loggpost, eller ta bort den. */
export function EditEntrySheet({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const db = useDb()

  async function handleSave(value: { grams: number; meal: LogEntry['meal'] }) {
    await updateEntry(db, entry.id, value)
    onClose()
  }

  async function handleDelete() {
    await deleteEntry(db, entry.id)
    onClose()
  }

  return (
    <Sheet title={entry.foodName} onClose={onClose}>
      <AmountForm
        food={{ per100g: entry.per100g }}
        initialGrams={entry.grams}
        initialMeal={entry.meal}
        submitLabel="Spara"
        onSubmit={handleSave}
        extraActions={
          <button type="button" className="button-danger" onClick={handleDelete}>
            Ta bort
          </button>
        }
      />
    </Sheet>
  )
}
