import { entryNutrients } from '../../domain/nutrition'
import type { IsoDate, LogEntry, Meal, Nutrients } from '../../domain/types'
import { formatNumber } from '../format'
import { MEAL_LABELS } from '../labels'
import { toHash } from '../router'

type Props = {
  date: IsoDate
  meal: Meal
  entries: LogEntry[]
  total: Nutrients
  onSelect: (entry: LogEntry) => void
}

export function MealSection({ date, meal, entries, total, onSelect }: Props) {
  const label = MEAL_LABELS[meal]
  return (
    <section className="card meal" aria-label={label}>
      <header className="meal-header">
        <h2>{label}</h2>
        <span className="meal-kcal">{formatNumber(total.kcal)} kcal</span>
      </header>
      {entries.length > 0 && (
        <ul className="entry-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="entry" onClick={() => onSelect(entry)}>
                <span className="entry-name">{entry.foodName}</span>
                <span className="entry-meta">
                  {formatNumber(entry.grams)} g · {formatNumber(entryNutrients(entry).kcal)} kcal
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <a className="button-secondary" href={toHash({ name: 'add', date, meal })}>
        Lägg till i {label.toLocaleLowerCase('sv')}
      </a>
    </section>
  )
}
