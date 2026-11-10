import { useState } from 'react'
import { addDays } from '../../domain/dates'
import { copiedEntries, mealDays, type MealDay } from '../../domain/nutrition/copyMeal'
import { MEALS, type IsoDate, type Meal } from '../../domain/types'
import { formatDayTitle, formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { usePreviousEntries } from '../hooks/useEntries'
import { useEntryActions } from '../hooks/useEntryActions'
import { MEAL_LABELS } from '../labels'
import { useToday } from '../todayContext'
import { Icon } from './Icon'
import { SegmentedControl } from './SegmentedControl'
import { Sheet } from './Sheet'

/** Hur många dagar bakåt från den visade dagen som går att kopiera från. */
const DAYS_BACK = 14

const MEAL_OPTIONS = MEALS.map((meal) => ({ value: meal, label: MEAL_LABELS[meal] }))

type Props = { date: IsoDate; meal: Meal; onClose: () => void }

function CopyDayOption({ day, label, selected, onSelect }: { day: MealDay; label: string; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button type="button" className="entry entry-row" aria-pressed={selected} onClick={onSelect}>
        <span className="entry-text">
          <span className="entry-name">{label}</span>
          <span className="entry-meta copy-day-items">{day.entries.map((e) => e.foodName).join(', ')}</span>
        </span>
        <span className="entry-kcal">{formatNumber(day.total.kcal)} kcal</span>
        <span className="copy-day-check" aria-hidden="true">
          {selected && <Icon name="check" size={20} strokeWidth={2.4} />}
        </span>
      </button>
    </li>
  )
}

/** Kopierar en tidigare måltid till den visade dagen, så att man slipper logga samma mat igen. */
export function CopyMealSheet({ date, meal, onClose }: Props) {
  const today = useToday()
  const entries = usePreviousEntries(date, DAYS_BACK)
  const actions = useEntryActions()
  const [sourceMeal, setSourceMeal] = useState(meal)
  const [chosenDate, setChosenDate] = useState<IsoDate | null>(null)

  const days = entries && mealDays(entries, sourceMeal)
  // Senaste dagen är förvald tills användaren väljer en annan
  const selected = days?.find((d) => d.date === chosenDate) ?? days?.[0]

  const copying = useAction(async (day: MealDay) => {
    await actions.addMany(copiedEntries(day.entries, { date, meal }))
    onClose()
  }, 'Kunde inte kopiera måltiden. Försök igen.')

  const target = MEAL_LABELS[meal].toLocaleLowerCase('sv')

  return (
    <Sheet title={`Kopiera till ${target}`} subtitle={`Välj en tidigare måltid. Den läggs till i ${target} den här dagen.`} onClose={onClose}>
      <div className="stack">
        <SegmentedControl label="Kopiera från" options={MEAL_OPTIONS} value={sourceMeal} onChange={setSourceMeal} />
        {!days && <p className="hint">Laddar…</p>}
        {days?.length === 0 && (
          <p className="hint">Inga loggade poster i {MEAL_LABELS[sourceMeal].toLocaleLowerCase('sv')} de senaste {DAYS_BACK} dagarna.</p>
        )}
        {days && days.length > 0 && (
          <ul className="food-list copy-day-list" aria-label="Tidigare dagar">
            {days.map((day) => (
              <CopyDayOption
                key={day.date}
                day={day}
                label={day.date === addDays(today, -1) ? 'Igår' : formatDayTitle(day.date)}
                selected={day.date === selected?.date}
                onSelect={() => setChosenDate(day.date)}
              />
            ))}
          </ul>
        )}
        {copying.error && (
          <p className="error" role="alert">
            {copying.error}
          </p>
        )}
        <button
          type="button"
          className="button-primary"
          disabled={!selected || copying.pending}
          onClick={() => selected && void copying.run(selected)}
        >
          {selected ? `Kopiera ${selected.entries.length} ${selected.entries.length === 1 ? 'post' : 'poster'}` : 'Kopiera'}
        </button>
      </div>
    </Sheet>
  )
}
