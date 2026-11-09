import { useId, useState, type FormEvent } from 'react'
import { isIsoDate } from '../../domain/dates'
import type { WeightEntry } from '../../domain/types'
import { isValidWeightKg } from '../../domain/weight'
import { formatNumber, parseNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useWeightActions } from '../hooks/useWeightActions'
import { useToday } from '../todayContext'
import { NumberField } from './NumberField'

/** Loggar en vägning. Datumet är idag om man inte väljer ett annat. */
export function WeightForm({ weights }: { weights: readonly WeightEntry[] }) {
  const today = useToday()
  const dateId = useId()
  const [kg, setKg] = useState('')
  const [date, setDate] = useState(today)
  const [saved, setSaved] = useState(false)
  const { log } = useWeightActions()
  const saving = useAction(async (d: string, value: number) => {
    await log(d, value)
    setKg('')
    setSaved(true)
  }, 'Vägningen kunde inte sparas. Försök igen.')

  const value = parseNumber(kg)
  const kgValid = isValidWeightKg(value)
  const dateValid = isIsoDate(date) && date <= today
  const existing = weights.find((w) => w.date === date)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (kgValid && dateValid) void saving.run(date, value)
  }

  return (
    <form className="card stack" aria-label="Logga vikt" onSubmit={handleSubmit} onChange={() => setSaved(false)}>
      <div className="field-row">
        <NumberField label="Vikt" unit="kg" value={kg} onChange={setKg} invalid={kg !== '' && !kgValid} />
        <div className="field">
          <label htmlFor={dateId}>Datum</label>
          <div className="field-input">
            <input id={dateId} type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} aria-invalid={!dateValid || undefined} />
          </div>
        </div>
      </div>
      {existing && <p className="hint">Ersätter vägningen på {formatNumber(existing.kg, 1)} kg den dagen.</p>}
      {!dateValid && <p className="error" role="alert">Välj ett datum som inte ligger i framtiden.</p>}
      {saving.error && <p className="error" role="alert">{saving.error}</p>}
      <button type="submit" className="button-primary" disabled={!kgValid || !dateValid || saving.pending}>
        Spara vikt
      </button>
      {saved && <p className="success" role="status">Vikten är sparad.</p>}
    </form>
  )
}
