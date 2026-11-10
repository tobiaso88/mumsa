import { isQuickEntry, quickEntryKcal, QUICK_ENTRY_NAME } from '../../domain/nutrition/quickEntry'
import type { LogEntry } from '../../domain/types'
import { useAction } from '../hooks/useAction'
import { useEntryActions } from '../hooks/useEntryActions'
import { AmountForm } from './AmountForm'
import { QuickEntryForm, type QuickEntryValue } from './QuickEntryForm'
import { Sheet } from './Sheet'

type Props = { entry: LogEntry; onClose: () => void }

/** Ändra mängd eller måltid för en loggpost, eller ta bort den. */
export function EditEntrySheet({ entry, onClose }: Props) {
  return isQuickEntry(entry) ? <EditQuickEntry entry={entry} onClose={onClose} /> : <EditAmount entry={entry} onClose={onClose} />
}

/** Hanterar ändring och borttagning, gemensamt för båda sorters poster. */
function useEntryEditing(entry: LogEntry, onClose: () => void) {
  const entries = useEntryActions()

  const saving = useAction(async (changes: Parameters<typeof entries.update>[1]) => {
    await entries.update(entry.id, changes)
    onClose()
  }, 'Ändringen kunde inte sparas. Försök igen.')

  const deleting = useAction(async () => {
    await entries.remove(entry.id)
    onClose()
  }, 'Posten kunde inte tas bort. Försök igen.')

  return { saving, deleting, busy: saving.pending || deleting.pending }
}

function DeleteButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" className="button-danger" onClick={onClick} disabled={disabled}>
      Ta bort
    </button>
  )
}

function EditAmount({ entry, onClose }: Props) {
  const { saving, deleting, busy } = useEntryEditing(entry, onClose)

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
        extraActions={<DeleteButton onClick={() => void deleting.run()} disabled={busy} />}
      />
    </Sheet>
  )
}

/** En snabbregistrering ändras i kalorier, eftersom gram inte betyder något för den. */
function EditQuickEntry({ entry, onClose }: Props) {
  const { saving, deleting, busy } = useEntryEditing(entry, onClose)

  function save({ name, kcal, meal }: QuickEntryValue) {
    void saving.run({ foodName: name.trim() || QUICK_ENTRY_NAME, grams: kcal, meal })
  }

  return (
    <Sheet title={entry.foodName} onClose={onClose}>
      <QuickEntryForm
        initial={{ name: entry.foodName === QUICK_ENTRY_NAME ? '' : entry.foodName, kcal: quickEntryKcal(entry), meal: entry.meal }}
        submitLabel="Spara"
        onSubmit={save}
        busy={busy}
        error={saving.error ?? deleting.error}
        extraActions={<DeleteButton onClick={() => void deleting.run()} disabled={busy} />}
      />
    </Sheet>
  )
}
