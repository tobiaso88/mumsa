import type { LogEntry } from '../../domain/types'
import { useAction } from '../hooks/useAction'
import { useEntryActions } from '../hooks/useEntryActions'
import { AmountForm } from './AmountForm'
import { Sheet } from './Sheet'

/** Ändra mängd eller måltid för en loggpost, eller ta bort den. */
export function EditEntrySheet({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  const entries = useEntryActions()

  const saving = useAction(async (value: { grams: number; meal: LogEntry['meal'] }) => {
    await entries.update(entry.id, value)
    onClose()
  }, 'Ändringen kunde inte sparas. Försök igen.')

  const deleting = useAction(async () => {
    await entries.remove(entry.id)
    onClose()
  }, 'Posten kunde inte tas bort. Försök igen.')

  const busy = saving.pending || deleting.pending

  return (
    <Sheet title={entry.foodName} onClose={onClose}>
      <AmountForm
        food={{ per100g: entry.per100g }}
        initialGrams={entry.grams}
        initialMeal={entry.meal}
        submitLabel="Spara"
        onSubmit={(value) => void saving.run(value)}
        busy={busy}
        error={saving.error ?? deleting.error}
        extraActions={
          <button type="button" className="button-danger" onClick={() => void deleting.run()} disabled={busy}>
            Ta bort
          </button>
        }
      />
    </Sheet>
  )
}
