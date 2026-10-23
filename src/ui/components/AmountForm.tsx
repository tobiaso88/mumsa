import { useId, type FormEvent, type ReactNode } from 'react'
import { MEALS, type Meal, type Nutrients } from '../../domain/types'
import { formatNumber } from '../format'
import { useAmountForm, type AmountFood } from '../hooks/useAmountForm'
import { MEAL_LABELS } from '../labels'
import { NumberField } from './NumberField'

function previewRows(n: Nutrients | null) {
  return [
    { label: 'kcal', value: n?.kcal, decimals: 0 },
    { label: 'protein', value: n?.protein, decimals: 1 },
    { label: 'kolh.', value: n?.carbs, decimals: 1 },
    { label: 'fett', value: n?.fat, decimals: 1 },
  ]
}

type Props = {
  food: AmountFood & { servingLabel?: string }
  initialGrams: number
  initialMeal: Meal
  submitLabel: string
  onSubmit: (value: { grams: number; meal: Meal }) => void
  extraActions?: ReactNode
}

export function AmountForm({ food, initialGrams, initialMeal, submitLabel, onSubmit, extraActions }: Props) {
  const form = useAmountForm(food, initialGrams, initialMeal)
  const mealId = useId()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.grams !== null) onSubmit({ grams: form.grams, meal: form.meal })
  }

  const portionText = food.servingLabel ? `portioner à ${food.servingLabel}` : 'portioner'
  return (
    <form className="stack" onSubmit={handleSubmit}>
      {form.canUsePortions && (
        <div className="segmented" role="radiogroup" aria-label="Enhet">
          <label>
            <input type="radio" name="unit" checked={form.unit === 'g'} onChange={() => form.setUnit('g')} />
            Gram
          </label>
          <label>
            <input type="radio" name="unit" checked={form.unit === 'portion'} onChange={() => form.setUnit('portion')} />
            Portioner
          </label>
        </div>
      )}
      <NumberField
        label="Mängd"
        unit={form.unit === 'g' ? 'g' : portionText}
        value={form.amount}
        onChange={form.setAmount}
        invalid={form.grams === null}
      />
      <div className="field">
        <label htmlFor={mealId}>Måltid</label>
        <select id={mealId} value={form.meal} onChange={(e) => form.setMeal(e.target.value as Meal)}>
          {MEALS.map((m) => (
            <option key={m} value={m}>
              {MEAL_LABELS[m]}
            </option>
          ))}
        </select>
      </div>
      <dl className="nutrient-preview" aria-label="Näring för vald mängd">
        {previewRows(form.preview).map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value === undefined ? '–' : formatNumber(row.value, row.decimals)}</dd>
          </div>
        ))}
      </dl>
      {form.unit === 'portion' && form.grams !== null && <p className="hint">Motsvarar {formatNumber(form.grams)} g.</p>}
      <button type="submit" className="button-primary" disabled={form.grams === null}>
        {submitLabel}
      </button>
      {extraActions}
    </form>
  )
}
