import { useId } from 'react'
import { PACE_KG_PER_WEEK } from '../../domain/goals/objectives'
import { OBJECTIVE_KINDS, PACES, type ObjectiveKind, type Pace } from '../../domain/types'
import { formatNumber } from '../format'
import type { GoalsFormSet, GoalsFormState } from '../hooks/useGoalsForm'
import { NumberField } from './NumberField'
import { SegmentedControl } from './SegmentedControl'

const OBJECTIVE_LABELS: Record<ObjectiveKind, string> = {
  lose: 'Gå ner i vikt',
  maintain: 'Behålla vikten',
  gain: 'Gå upp i vikt',
  build_muscle: 'Bygga muskler',
}

const PACE_LABELS: Record<Pace, string> = { slow: 'Lugn', moderate: 'Måttlig' }
const PACE_OPTIONS = PACES.map((pace) => ({ value: pace, label: PACE_LABELS[pace] }))

type Props = {
  state: GoalsFormState
  set: GoalsFormSet
  setObjective: (kind: ObjectiveKind) => void
  targetWeightValid: boolean
}

export function ObjectiveFields({ state, set, setObjective, targetWeightValid }: Props) {
  const objectiveId = useId()
  const changesWeight = state.objective !== 'maintain'
  return (
    <fieldset className="card">
      <legend>Ditt mål</legend>
      <div className="field">
        <label htmlFor={objectiveId}>Vad vill du uppnå?</label>
        <select id={objectiveId} value={state.objective} onChange={(e) => setObjective(e.target.value as ObjectiveKind)}>
          {OBJECTIVE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {OBJECTIVE_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      {changesWeight && (
        <>
          <div className="field">
            <span className="label" aria-hidden="true">
              Takt
            </span>
            <SegmentedControl label="Takt" options={PACE_OPTIONS} value={state.pace} onChange={(pace) => set('pace', pace)} />
            <p className="hint">Ungefär {formatNumber(PACE_KG_PER_WEEK[state.pace], 2)} kg per vecka.</p>
          </div>
          <NumberField
            label="Målvikt (frivillig)"
            unit="kg"
            value={state.targetWeight}
            onChange={(v) => set('targetWeight', v)}
            invalid={!targetWeightValid}
          />
          {!targetWeightValid && (
            <p className="error" role="alert">
              Ange målvikten i kilo, till exempel 68,5.
            </p>
          )}
        </>
      )}
      <p className="hint">Fördelningen av energi nedan fylls i som en utgångspunkt när du byter mål. Du kan ändra den.</p>
    </fieldset>
  )
}
