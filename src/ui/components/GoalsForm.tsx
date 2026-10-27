import { useState, type FormEvent } from 'react'
import type { Goals, Profile } from '../../domain/types'
import { formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useGoalsForm, type GoalMode } from '../hooks/useGoalsForm'
import { useSaveGoals } from '../hooks/useSaveGoals'
import { NumberField } from './NumberField'
import { ProfileFields } from './ProfileFields'
import { SplitFields } from './SplitFields'

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
      <div className="segmented" role="radiogroup" aria-label="Hur vill du sätta målet?">
        <label>
          <input type="radio" name="mode" checked={state.mode === 'calculated'} onChange={() => setMode('calculated')} />
          Räkna ut åt mig
        </label>
        <label>
          <input type="radio" name="mode" checked={state.mode === 'manual'} onChange={() => setMode('manual')} />
          Ange själv
        </label>
      </div>

      {state.mode === 'calculated' ? (
        <>
          <ProfileFields state={state} set={set} />
          <div className="card">
            {form.estimate !== null ? (
              <p className="estimate">
                Uppskattat behov: <strong>{formatNumber(form.estimate)} kcal</strong> per dag
              </p>
            ) : (
              <p className="hint">Fyll i alla fält för att se en uppskattning. Formeln gäller vuxna från 18 år.</p>
            )}
            <p className="hint">
              Uppskattningen bygger på en standardformel (Mifflin–St Jeor) och är ingen rekommendation eller
              medicinsk bedömning. Justera gärna målet efter hur det fungerar för dig.
            </p>
          </div>
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
