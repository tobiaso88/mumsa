import { useId } from 'react'
import { ACTIVITY_LEVELS, SEXES, type ActivityLevel } from '../../domain/types'
import { formatNumber, parseNumber, toInputText } from '../format'
import type { GoalsFormSet, GoalsFormState } from '../hooks/useGoalsForm'
import { ACTIVITY_LABELS, SEX_LABELS } from '../labels'
import { NumberField } from './NumberField'
import { SegmentedControl } from './SegmentedControl'

const SEX_OPTIONS = SEXES.map((sex) => ({ value: sex, label: SEX_LABELS[sex] }))

type Props = {
  state: GoalsFormState
  set: GoalsFormSet
  /** Senaste vägningen, om det finns någon. */
  latestWeightKg?: number
}

export function ProfileFields({ state, set, latestWeightKg }: Props) {
  const activityId = useId()
  const offerLatest = latestWeightKg !== undefined && parseNumber(state.weight) !== latestWeightKg
  return (
    <fieldset className="card">
      <legend>Om dig</legend>
      <div className="field-row">
        <NumberField label="Vikt" unit="kg" value={state.weight} onChange={(v) => set('weight', v)} />
        <NumberField label="Längd" unit="cm" value={state.height} onChange={(v) => set('height', v)} />
        <NumberField label="Ålder" unit="år" value={state.age} onChange={(v) => set('age', v)} />
      </div>
      {offerLatest && (
        <button type="button" className="button-secondary" onClick={() => set('weight', toInputText(latestWeightKg))}>
          Använd senaste vägningen ({formatNumber(latestWeightKg, 1)} kg)
        </button>
      )}
      <div className="field">
        <span className="label" aria-hidden="true">
          Kön (används i formeln)
        </span>
        <SegmentedControl
          label="Kön (används i formeln)"
          options={SEX_OPTIONS}
          value={state.sex}
          onChange={(sex) => set('sex', sex)}
        />
      </div>
      <div className="field">
        <label htmlFor={activityId}>Aktivitetsnivå</label>
        <select id={activityId} value={state.activity} onChange={(e) => set('activity', e.target.value as ActivityLevel)}>
          {ACTIVITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {ACTIVITY_LABELS[level]}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}
