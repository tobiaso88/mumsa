import { useState, type FormEvent, type ReactNode } from 'react'
import { MEALS, type Meal } from '../../domain/types'
import { MAX_QUICK_KCAL, isValidQuickKcal } from '../../domain/nutrition/quickEntry'
import { MAX_TEXT_LENGTH } from '../../domain/foods/foodValidation'
import { parseNumber, toInputText } from '../format'
import { MEAL_LABELS } from '../labels'
import { NumberField } from './NumberField'
import { SegmentedControl } from './SegmentedControl'
import { TextField } from './TextField'

const MEAL_OPTIONS = MEALS.map((meal) => ({ value: meal, label: MEAL_LABELS[meal] }))

export type QuickEntryValue = { name: string; kcal: number; meal: Meal }

type Props = {
  initial: { name: string; kcal?: number; meal: Meal }
  /** Text på knappen, eller en funktion av vald måltid, t.ex. "Lägg till i lunch". */
  submitLabel: string | ((meal: Meal) => string)
  onSubmit: (value: QuickEntryValue) => void
  extraActions?: ReactNode
  busy?: boolean
  error?: string | null
}

/** Namn, kalorier och måltid för en post där bara energin är känd. */
export function QuickEntryForm({ initial, submitLabel, onSubmit, extraActions, busy, error }: Props) {
  const [name, setName] = useState(initial.name)
  const [kcalText, setKcalText] = useState(toInputText(initial.kcal))
  const [meal, setMeal] = useState(initial.meal)
  const kcal = parseNumber(kcalText)
  const valid = isValidQuickKcal(Number.isNaN(kcal) ? null : kcal)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (valid) onSubmit({ name, kcal, meal })
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <TextField label="Namn (valfritt)" value={name} onChange={setName} maxLength={MAX_TEXT_LENGTH} placeholder="T.ex. lunch på restaurang" />
      <NumberField label="Energi" value={kcalText} onChange={setKcalText} unit="kcal" invalid={kcalText !== '' && !valid} />
      {kcalText !== '' && !valid && <p className="error">Ange mellan 1 och {MAX_QUICK_KCAL.toLocaleString('sv-SE')} kcal.</p>}
      <SegmentedControl label="Måltid" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />
      <p className="hint">Protein, kolhydrater och fett räknas inte med i dagens summa.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button-primary" disabled={!valid || busy}>
        {typeof submitLabel === 'function' ? submitLabel(meal) : submitLabel}
      </button>
      {extraActions}
    </form>
  )
}
