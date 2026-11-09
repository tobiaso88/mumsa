import type { FormEvent, ReactNode } from 'react'
import { MEALS, type Meal } from '../../domain/types'
import { formatNumber } from '../format'
import { useAmountForm, type AmountFood } from '../hooks/useAmountForm'
import { MEAL_LABELS } from '../labels'
import { AmountStepper } from './AmountStepper'
import { NutrientPreview } from './NutrientPreview'
import { SegmentedControl } from './SegmentedControl'

const UNIT_OPTIONS = [
  { value: 'g', label: 'Gram' },
  { value: 'portion', label: 'Portioner' },
] as const

const MEAL_OPTIONS = MEALS.map((meal) => ({ value: meal, label: MEAL_LABELS[meal] }))

type Props = {
  food: AmountFood & { servingLabel?: string }
  initialGrams: number
  initialMeal: Meal
  /** Börja i portioner i stället för gram, för livsmedel som oftast loggas som en portion. */
  preferPortions?: boolean
  /** Text på knappen, eller en funktion av vald måltid, t.ex. "Lägg till i lunch". */
  submitLabel: string | ((meal: Meal) => string)
  onSubmit: (value: { grams: number; meal: Meal }) => void
  extraActions?: ReactNode
  /** Sant medan formuläret sparas. Stänger av knappen så att inget sparas två gånger. */
  busy?: boolean
  error?: string | null
}

export function AmountForm({ food, initialGrams, initialMeal, preferPortions, submitLabel, onSubmit, extraActions, busy, error }: Props) {
  const form = useAmountForm(food, initialGrams, initialMeal, preferPortions)

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
      <NutrientPreview nutrients={form.preview} label="Näring för vald mängd" />
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
