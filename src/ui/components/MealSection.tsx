import { entryNutrients } from '../../domain/nutrition/nutrition'
import { isQuickEntry } from '../../domain/nutrition/quickEntry'
import type { IsoDate, LogEntry, Meal, Nutrients } from '../../domain/types'
import { formatNumber } from '../format'
import { MEAL_ICONS, MEAL_LABELS } from '../labels'
import { toHash } from '../router'
import { Icon } from './Icon'

type Props = {
  date: IsoDate
  meal: Meal
  entries: LogEntry[]
  total: Nutrients
  onSelect: (entry: LogEntry) => void
  onCopy: (meal: Meal) => void
}

export function MealSection({ date, meal, entries, total, onSelect, onCopy }: Props) {
  const label = MEAL_LABELS[meal]
  return (
    <section className="card meal" aria-label={label}>
      <header className="meal-header">
        <span className="meal-icon">
          <Icon name={MEAL_ICONS[meal]} size={20} />
        </span>
        <h2>{label}</h2>
        <span className="meal-kcal">
          {entries.length > 0 ? (
            `${formatNumber(total.kcal)} kcal`
          ) : (
            <>
              <span aria-hidden="true">–</span>
              <span className="visually-hidden">0 kcal</span>
            </>
          )}
        </span>
        <button type="button" className="meal-add" aria-label={`Kopiera till ${label.toLocaleLowerCase('sv')}`} onClick={() => onCopy(meal)}>
          <Icon name="copy" size={22} />
        </button>
        <a className="meal-add" href={toHash({ name: 'add', date, meal })} aria-label={`Lägg till i ${label.toLocaleLowerCase('sv')}`}>
          <Icon name="plus" size={24} strokeWidth={2.2} />
        </a>
      </header>
      {entries.length > 0 && (
        <ul className="entry-list">
          {entries.map((entry) => {
            // Gram betyder inget för en snabbregistrering, som bara har kalorier
            const grams = isQuickEntry(entry) ? null : `${formatNumber(entry.grams)} g`
            const kcal = formatNumber(entryNutrients(entry).kcal)
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className="entry entry-row"
                  aria-label={grams ? `${entry.foodName}, ${grams}, ${kcal} kcal` : `${entry.foodName}, ${kcal} kcal`}
                  onClick={() => onSelect(entry)}
                >
                  <span className="entry-text">
                    <span className="entry-name">{entry.foodName}</span>
                    {grams && <span className="entry-meta">{grams}</span>}
                  </span>
                  <span className="entry-kcal">{kcal}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
