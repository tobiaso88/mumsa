import type { FormEvent, ReactNode } from 'react'
import { MEALS, type Food, type Meal } from '../../domain/types'
import { useAmountForm, type AmountFood } from '../hooks/useAmountForm'
import { MEAL_LABELS } from '../labels'
import { AmountInput } from './AmountInput'
import { NutrientPreview } from './NutrientPreview'
import { SegmentedControl } from './SegmentedControl'

const MEAL_OPTIONS = MEALS.map((meal) => ({ value: meal, label: MEAL_LABELS[meal] }))

type Props = {
  food: AmountFood & { servingLabel?: string; source?: Food['source'] }
  initialGrams: number
  initialMeal: Meal
  /** Börja i portioner i stället för gram, för livsmedel som oftast loggas som en portion. */
  preferPortions?: boolean
  /** Startmängden är sparad, t.ex. när en loggpost ändras, och räknas om vid enhetsbyte. */
  initialIsSaved?: boolean
  /** Text på knappen, eller en funktion av vald måltid, t.ex. "Lägg till i lunch". */
  submitLabel: string | ((meal: Meal) => string)
  onSubmit: (value: { grams: number; meal: Meal }) => void
  extraActions?: ReactNode
  /** Sant medan formuläret sparas. Stänger av knappen så att inget sparas två gånger. */
  busy?: boolean
  error?: string | null
}

export function AmountForm(props: Props) {
  const { food, initialGrams, initialMeal, preferPortions, initialIsSaved, submitLabel, onSubmit, extraActions, busy, error } = props
  const form = useAmountForm(food, initialGrams, initialMeal, { preferPortions, initialIsSaved })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.grams !== null) onSubmit({ grams: form.grams, meal: form.meal })
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <AmountInput amount={form} servingLabel={food.servingLabel} source={food.source} />
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
