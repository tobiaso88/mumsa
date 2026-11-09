import { useState } from 'react'
import type { WeightEntry } from '../../domain/types'
import { formatDayTitle, formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useWeightActions } from '../hooks/useWeightActions'
import { Sheet } from './Sheet'

/** Vägningarna nyast först. En rad öppnar ett ark där vägningen kan tas bort. */
export function WeightList({ weights }: { weights: readonly WeightEntry[] }) {
  const { remove } = useWeightActions()
  const [selected, setSelected] = useState<WeightEntry | null>(null)
  const removing = useAction(async (date: string) => {
    await remove(date)
    setSelected(null)
  }, 'Vägningen kunde inte tas bort. Försök igen.')
  if (weights.length === 0) return null

  function handleRemove(entry: WeightEntry) {
    const question = `Ta bort vägningen ${formatDayTitle(entry.date)}?`
    if (window.confirm(question)) void removing.run(entry.date)
  }

  return (
    <section aria-labelledby="weights-title">
      <h2 id="weights-title" className="section-title">
        Vägningar
      </h2>
      <ul className="food-list">
        {[...weights].reverse().map((w) => (
          <li key={w.date}>
            <button type="button" className="entry week-day" onClick={() => setSelected(w)}>
              <span className="entry-name">{formatDayTitle(w.date)}</span>
              <span className="entry-value">{formatNumber(w.kg, 1)} kg</span>
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <Sheet title={formatDayTitle(selected.date)} subtitle={`${formatNumber(selected.kg, 1)} kg`} onClose={() => setSelected(null)}>
          {removing.error && (
            <p className="error" role="alert">
              {removing.error}
            </p>
          )}
          <button type="button" className="button-danger" onClick={() => handleRemove(selected)} disabled={removing.pending}>
            Ta bort vägningen
          </button>
        </Sheet>
      )}
    </section>
  )
}
