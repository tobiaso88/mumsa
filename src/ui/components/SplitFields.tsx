import { macroGrams } from '../../domain/goals'
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

export function SplitFields({ state, set, split, valid, kcal }: Props) {
  const sum = split.proteinPct + split.carbsPct + split.fatPct
  const grams = valid && Number.isFinite(kcal) ? macroGrams(kcal, split) : null
  return (
    <fieldset className="card">
      <legend>Fördelning av energi</legend>
      <div className="field-row">
        <NumberField label="Protein" unit="%" value={state.protein} onChange={(v) => set('protein', v)} invalid={!valid} />
        <NumberField label="Kolhydrater" unit="%" value={state.carbs} onChange={(v) => set('carbs', v)} invalid={!valid} />
        <NumberField label="Fett" unit="%" value={state.fat} onChange={(v) => set('fat', v)} invalid={!valid} />
      </div>
      {valid ? (
        grams && (
          <p className="hint">
            Ungefär {formatNumber(grams.protein)} g protein, {formatNumber(grams.carbs)} g kolhydrater och{' '}
            {formatNumber(grams.fat)} g fett per dag.
          </p>
        )
      ) : (
        <p className="error" role="alert">
          Andelarna ska bli 100 % tillsammans, nu blir de {Number.isFinite(sum) ? formatNumber(sum, 1) : '–'} %.
        </p>
      )}
    </fieldset>
  )
}
