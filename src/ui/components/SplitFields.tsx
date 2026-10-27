import { macroGrams, splitTotal } from '../../domain/goals'
import type { MacroSplit } from '../../domain/types'
import { formatNumber } from '../format'
import type { GoalsFormState } from '../hooks/useGoalsForm'
import { NumberField } from './NumberField'

type Props = {
  state: GoalsFormState
  set: (key: 'protein' | 'carbs' | 'fat', value: string) => void
  split: MacroSplit
  valid: boolean
  kcal: number
}

/** Fel om andelarna inte blir 100 %, annars ungefärliga gram per dag när kalorimålet är känt. */
function SplitSummary({ split, valid, kcal }: Pick<Props, 'split' | 'valid' | 'kcal'>) {
  if (!valid) {
    const sum = splitTotal(split)
    return (
      <p className="error" role="alert">
        Andelarna ska bli 100 % tillsammans, nu blir de {Number.isFinite(sum) ? formatNumber(sum, 1) : '–'} %.
      </p>
    )
  }
  if (!Number.isFinite(kcal)) return null
  const grams = macroGrams(kcal, split)
  return (
    <p className="hint">
      Ungefär {formatNumber(grams.protein)} g protein, {formatNumber(grams.carbs)} g kolhydrater och{' '}
      {formatNumber(grams.fat)} g fett per dag.
    </p>
  )
}

export function SplitFields({ state, set, split, valid, kcal }: Props) {
  return (
    <fieldset className="card">
      <legend>Fördelning av energi</legend>
      <div className="field-row">
        <NumberField label="Protein" unit="%" value={state.protein} onChange={(v) => set('protein', v)} invalid={!valid} />
        <NumberField label="Kolhydrater" unit="%" value={state.carbs} onChange={(v) => set('carbs', v)} invalid={!valid} />
        <NumberField label="Fett" unit="%" value={state.fat} onChange={(v) => set('fat', v)} invalid={!valid} />
      </div>
      <SplitSummary split={split} valid={valid} kcal={kcal} />
    </fieldset>
  )
}
