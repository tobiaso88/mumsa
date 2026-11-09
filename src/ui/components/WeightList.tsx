import type { WeightEntry } from '../../domain/types'
import { formatDayTitle, formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useWeightActions } from '../hooks/useWeightActions'

/** Vägningarna nyast först, med möjlighet att ta bort en. */
export function WeightList({ weights }: { weights: readonly WeightEntry[] }) {
  const { remove } = useWeightActions()
  const removing = useAction(remove, 'Vägningen kunde inte tas bort. Försök igen.')
  if (weights.length === 0) return null

  function handleRemove(entry: WeightEntry) {
    const question = `Ta bort vägningen ${formatDayTitle(entry.date)}?`
    if (window.confirm(question)) void removing.run(entry.date)
  }

  return (
    <section aria-labelledby="weights-title">
      <h2 id="weights-title">Vägningar</h2>
      {removing.error && <p className="error" role="alert">{removing.error}</p>}
      <ul className="food-list">
        {[...weights].reverse().map((w) => (
          <li key={w.date} className="weight-row">
            <span className="entry-name">{formatDayTitle(w.date)}</span>
            <span className="weight-row-end">
              <span className="entry-meta">{formatNumber(w.kg, 1)} kg</span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Ta bort vägningen ${formatDayTitle(w.date)}`}
                onClick={() => handleRemove(w)}
                disabled={removing.pending}
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
