import type { IsoDate, Meal } from '../../domain/types'
import { quickEntryInput, QUICK_ENTRY_NAME } from '../../domain/nutrition/quickEntry'
import { useAction } from '../hooks/useAction'
import { useEntryActions } from '../hooks/useEntryActions'
import { MEAL_LABELS } from '../labels'
import { navigate } from '../router'
import { QuickEntryForm, type QuickEntryValue } from './QuickEntryForm'
import { Sheet } from './Sheet'

/** Loggar bara kalorier, för mat där näringen inte är känd. */
export function QuickEntrySheet({ date, meal, onClose }: { date: IsoDate; meal: Meal; onClose: () => void }) {
  const entries = useEntryActions()
  const adding = useAction(async (value: QuickEntryValue) => {
    await entries.add(quickEntryInput(date, value.meal, value.kcal, value.name))
    navigate({ name: 'day', date })
  }, 'Kunde inte logga kalorierna. Försök igen.')

  return (
    <Sheet title={QUICK_ENTRY_NAME} subtitle="Logga bara kalorier när du inte vet vad maten innehåller." onClose={onClose}>
      <QuickEntryForm
        initial={{ name: '', meal }}
        submitLabel={(m) => `Lägg till i ${MEAL_LABELS[m].toLocaleLowerCase('sv')}`}
        onSubmit={(value) => void adding.run(value)}
        busy={adding.pending}
        error={adding.error}
      />
    </Sheet>
  )
}
