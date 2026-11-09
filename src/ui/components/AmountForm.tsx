import type { FormEvent, ReactNode } from 'react'
import { MEALS, type Meal, type Nutrients } from '../../domain/types'
import { formatNumber } from '../format'
import { useAmountForm, type AmountFood } from '../hooks/useAmountForm'
import { MEAL_LABELS } from '../labels'
import { AmountStepper } from './AmountStepper'
import { SegmentedControl } from './SegmentedControl'

const UNIT_OPTIONS = [
  { value: 'g', label: 'Gram' },
  { value: 'portion', label: 'Portioner' },
] as const

const MEAL_OPTIONS = MEALS.map((meal) => ({ value: meal, label: MEAL_LABELS[meal] }))

function previewRows(n: Nutrients | null) {
  return [
    { label: 'kcal', value: n?.kcal, decimals: 0, color: 'var(--accent)' },
    { label: 'protein', value: n?.protein, decimals: 1, color: 'var(--protein)' },
    { label: 'kolh.', value: n?.carbs, decimals: 1, color: 'var(--carbs)' },
    { label: 'fett', value: n?.fat, decimals: 1, color: 'var(--fat)' },
  ]
}

type Props = {
  food: AmountFood & { servingLabel?: string }
  initialGrams: number
  initialMeal: Meal
  /** Text på knappen, eller en funktion av vald måltid, t.ex. "Lägg till i lunch". */
  submitLabel: string | ((meal: Meal) => string)
  onSubmit: (value: { grams: number; meal: Meal }) => void
  extraActions?: ReactNode
  /** Sant medan formuläret sparas. Stänger av knappen så att inget sparas två gånger. */
  busy?: boolean
  error?: string | null
}

export function AmountForm({ food, initialGrams, initialMeal, submitLabel, onSubmit, extraActions, busy, error }: Props) {
  const form = useAmountForm(food, initialGrams, initialMeal)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.grams !== null) onSubmit({ grams: form.grams, meal: form.meal })
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {form.canUsePortions && <SegmentedControl label="Enhet" options={UNIT_OPTIONS} value={form.unit} onChange={form.setUnit} />}
      <AmountStepper
        value={form.amount}
        onChange={form.setAmount}
        onStep={form.step}
        unit={form.unit === 'g' ? 'g' : 'portioner'}
        invalid={form.grams === null}
      />
      {form.unit === 'portion' && (
        <p className="hint stepper-hint">
          {food.servingLabel && <span>En portion är {food.servingLabel}. </span>}
          {form.grams !== null && <span>Motsvarar {formatNumber(form.grams)} g.</span>}
        </p>
      )}
      <SegmentedControl label="Måltid" options={MEAL_OPTIONS} value={form.meal} onChange={form.setMeal} />
      <dl className="nutrient-preview" aria-label="Näring för vald mängd">
        {previewRows(form.preview).map((row) => (
          <div key={row.label}>
            <dt>
              <span className="dot" style={{ background: row.color }} />
              {row.label}
            </dt>
            <dd>{row.value === undefined ? '–' : formatNumber(row.value, row.decimals)}</dd>
          </div>
        ))}
      </dl>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button-primary" disabled={form.grams === null || busy}>
        {typeof submitLabel === 'function' ? submitLabel(form.meal) : submitLabel}
      </button>
      {extraActions}
    </form>
  )
}
