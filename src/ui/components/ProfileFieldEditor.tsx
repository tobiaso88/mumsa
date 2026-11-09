import type { ReactNode } from 'react'
import { PACE_KG_PER_WEEK } from '../../domain/goals/objectives'
import { ACTIVITY_LEVELS, OBJECTIVE_KINDS, PACES, SEXES } from '../../domain/types'
import { formatNumber, parseNumber, toInputText } from '../format'
import type { GoalMode, GoalsFormApi } from '../hooks/useGoalsForm'
import { ACTIVITY_LABELS, OBJECTIVE_LABELS, PACE_LABELS, SEX_LABELS, type ProfileField } from '../labels'
import { ChoiceList } from './ChoiceList'
import { EstimateCard } from './EstimateCard'
import { NumberField } from './NumberField'
import { ProfileFields } from './ProfileFields'
import { SegmentedControl } from './SegmentedControl'
import { SplitFields } from './SplitFields'

const MODE_OPTIONS: readonly { value: GoalMode; label: string }[] = [
  { value: 'calculated', label: 'Räkna ut åt mig' },
  { value: 'manual', label: 'Ange själv' },
]
const OBJECTIVE_OPTIONS = OBJECTIVE_KINDS.map((kind) => ({ value: kind, label: OBJECTIVE_LABELS[kind] }))
const PACE_OPTIONS = PACES.map((pace) => ({
  value: pace,
  label: PACE_LABELS[pace],
  hint: `Ungefär ${formatNumber(PACE_KG_PER_WEEK[pace], 2)} kg per vecka`,
}))
const SEX_OPTIONS = SEXES.map((sex) => ({ value: sex, label: SEX_LABELS[sex] }))
const ACTIVITY_OPTIONS = ACTIVITY_LEVELS.map((level) => ({ value: level, label: ACTIVITY_LABELS[level] }))

type Props = {
  field: ProfileField
  form: GoalsFormApi
  latestWeightKg?: number
}

function NumberCard({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>
}

/** Kontrollen för en enda inställning. Hela uträkningen sköts av useGoalsForm. */
export function ProfileFieldEditor({ field, form, latestWeightKg }: Props) {
  const { state, set } = form
  switch (field) {
    case 'mode':
      return (
        <>
          <SegmentedControl label="Hur vill du sätta målet?" options={MODE_OPTIONS} value={state.mode} onChange={(m) => set('mode', m)} />
          {state.mode === 'manual' ? (
            <NumberCard>
              <NumberField label="Kalorimål per dag" unit="kcal" value={state.kcal} onChange={(v) => set('kcal', v)} />
            </NumberCard>
          ) : (
            <>
              {!form.parsedProfile && <ProfileFields state={state} set={set} latestWeightKg={latestWeightKg} />}
              <EstimateCard estimate={form.estimate} kcal={form.kcal} />
            </>
          )}
        </>
      )
    case 'kcal':
      return (
        <NumberCard>
          <NumberField label="Kalorimål per dag" unit="kcal" value={state.kcal} onChange={(v) => set('kcal', v)} invalid={!form.kcalValid} />
        </NumberCard>
      )
    case 'objective':
      return <ChoiceList label="Vad vill du uppnå?" options={OBJECTIVE_OPTIONS} value={state.objective} onChange={form.setObjective} />
    case 'pace':
      return <ChoiceList label="Takt" options={PACE_OPTIONS} value={state.pace} onChange={(p) => set('pace', p)} />
    case 'targetWeight':
      return (
        <>
          <NumberCard>
            <NumberField label="Målvikt" unit="kg" value={state.targetWeight} onChange={(v) => set('targetWeight', v)} invalid={!form.targetWeightValid} />
          </NumberCard>
          {form.targetWeightValid ? (
            <p className="hint group-footer">Lämna tomt om du inte vill ha någon målvikt.</p>
          ) : (
            <p className="error group-footer" role="alert">
              Ange målvikten i kilo, till exempel 68,5.
            </p>
          )}
        </>
      )
    case 'split':
      return <SplitFields state={state} set={set} split={form.split} valid={form.splitValid} kcal={form.kcal} />
    case 'sex':
      return <ChoiceList label="Kön" options={SEX_OPTIONS} value={state.sex} onChange={(s) => set('sex', s)} />
    case 'activity':
      return <ChoiceList label="Aktivitetsnivå" options={ACTIVITY_OPTIONS} value={state.activity} onChange={(a) => set('activity', a)} />
    case 'age':
      return (
        <NumberCard>
          <NumberField label="Ålder" unit="år" value={state.age} onChange={(v) => set('age', v)} />
        </NumberCard>
      )
    case 'height':
      return (
        <NumberCard>
          <NumberField label="Längd" unit="cm" value={state.height} onChange={(v) => set('height', v)} />
        </NumberCard>
      )
    case 'weight':
      return (
        <>
          <NumberCard>
            <NumberField label="Vikt" unit="kg" value={state.weight} onChange={(v) => set('weight', v)} />
          </NumberCard>
          {latestWeightKg !== undefined && parseNumber(state.weight) !== latestWeightKg && (
            <button type="button" className="button-secondary" onClick={() => set('weight', toInputText(latestWeightKg))}>
              Använd senaste vägningen ({formatNumber(latestWeightKg, 1)} kg)
            </button>
          )}
        </>
      )
  }
}
