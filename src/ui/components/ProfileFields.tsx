import { useId } from 'react'
import { ACTIVITY_LEVELS, SEXES, type ActivityLevel, type Sex } from '../../domain/types'
import type { GoalsFormState } from '../hooks/useGoalsForm'
import { NumberField } from './NumberField'
import { SegmentedControl } from './SegmentedControl'

const SEX_LABELS: Record<Sex, string> = { female: 'Kvinna', male: 'Man' }
const SEX_OPTIONS = SEXES.map((sex) => ({ value: sex, label: SEX_LABELS[sex] }))

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Stillasittande, lite eller ingen träning',
  light: 'Lätt aktiv, träning 1–3 dagar i veckan',
  moderate: 'Måttligt aktiv, träning 3–5 dagar i veckan',
  active: 'Mycket aktiv, träning 6–7 dagar i veckan',
  very_active: 'Extremt aktiv, fysiskt arbete och träning',
}

type Props = {
  state: GoalsFormState
  set: <K extends keyof GoalsFormState>(key: K, value: GoalsFormState[K]) => void
}

export function ProfileFields({ state, set }: Props) {
  const activityId = useId()
  return (
    <fieldset className="card">
      <legend>Om dig</legend>
      <div className="field-row">
        <NumberField label="Vikt" unit="kg" value={state.weight} onChange={(v) => set('weight', v)} />
        <NumberField label="Längd" unit="cm" value={state.height} onChange={(v) => set('height', v)} />
        <NumberField label="Ålder" unit="år" value={state.age} onChange={(v) => set('age', v)} />
      </div>
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
