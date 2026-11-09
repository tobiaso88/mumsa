import { useState, type FormEvent } from 'react'
import type { Goals, Profile } from '../../domain/types'
import { useAction } from '../hooks/useAction'
import { useGoalsForm, type GoalMode } from '../hooks/useGoalsForm'
import { useSaveGoals } from '../hooks/useSaveGoals'
import { useWeights } from '../hooks/useWeights'
import { EstimateCard } from './EstimateCard'
import { NumberField } from './NumberField'
import { ObjectiveFields } from './ObjectiveFields'
import { ProfileFields } from './ProfileFields'
import { SegmentedControl } from './SegmentedControl'
import { SplitFields } from './SplitFields'

const MODE_OPTIONS: readonly { value: GoalMode; label: string }[] = [
  { value: 'calculated', label: 'Räkna ut åt mig' },
  { value: 'manual', label: 'Ange själv' },
]

type Props = {
  goals: Goals | null
  profile: Profile | null
  submitLabel: string
  onSaved?: () => void
}

export function GoalsForm({ goals, profile, submitLabel, onSaved }: Props) {
  const form = useGoalsForm(goals, profile)
  const { state, set } = form
  const [saved, setSaved] = useState(false)
  const save = useSaveGoals()
  const latestWeightKg = useWeights()?.at(-1)?.kg

  const saving = useAction(async (result: { goals: Goals; profile: Profile | null }) => {
    await save(result.goals, result.profile)
    setSaved(true)
    onSaved?.()
  }, 'Målet kunde inte sparas. Försök igen.')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.result) void saving.run(form.result)
  }

  const setMode = (mode: GoalMode) => {
    setSaved(false)
    set('mode', mode)
  }

  return (
    <form className="stack" onSubmit={handleSubmit} onChange={() => setSaved(false)}>
      <SegmentedControl label="Hur vill du sätta målet?" options={MODE_OPTIONS} value={state.mode} onChange={setMode} />

      <ObjectiveFields state={state} set={set} setObjective={form.setObjective} targetWeightValid={form.targetWeightValid} />

      {state.mode === 'calculated' ? (
        <>
          <ProfileFields state={state} set={set} latestWeightKg={latestWeightKg} />
          <EstimateCard estimate={form.estimate} kcal={form.kcal} />
        </>
      ) : (
        <div className="card">
          <NumberField label="Kalorimål per dag" unit="kcal" value={state.kcal} onChange={(v) => set('kcal', v)} />
        </div>
      )}

      <SplitFields state={state} set={set} split={form.split} valid={form.splitValid} kcal={form.kcal} />

      {saving.error && (
        <p className="error" role="alert">
          {saving.error}
        </p>
      )}
      <button type="submit" className="button-primary" disabled={!form.result || saving.pending}>
        {submitLabel}
      </button>
      {saved && (
        <p className="success" role="status">
          Målet är sparat.
        </p>
      )}
    </form>
  )
}
