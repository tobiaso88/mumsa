import type { FormEvent } from 'react'
import type { Goals, Profile } from '../../domain/types'
import { formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useGoalsForm, type GoalsFormApi } from '../hooks/useGoalsForm'
import { useSaveGoals } from '../hooks/useSaveGoals'
import { useWeights } from '../hooks/useWeights'
import { PROFILE_FIELD_TITLES, type ProfileField } from '../labels'
import { ProfileFieldEditor } from './ProfileFieldEditor'
import { Sheet } from './Sheet'


const PROFILE_FIELDS: ReadonlySet<ProfileField> = new Set(['sex', 'age', 'height', 'weight', 'activity'])

type Props = {
  field: ProfileField
  goals: Goals
  profile: Profile | null
  onClose: () => void
}

/** Visar vad ändringen gör med det dagliga målet och fördelningen innan den sparas. */
function ChangePreview({ form, goals }: { form: GoalsFormApi; goals: Goals }) {
  const next = form.result?.goals
  if (!next) return null
  const kcalChanged = next.kcal !== goals.kcal
  const s = next.split
  const splitChanged = s.proteinPct !== goals.split.proteinPct || s.carbsPct !== goals.split.carbsPct || s.fatPct !== goals.split.fatPct
  if (!kcalChanged && !splitChanged) return null
  return (
    <div className="hint group-footer" role="status">
      {kcalChanged && (
        <p>
          Dagligt mål blir <strong>{formatNumber(next.kcal)} kcal</strong> (nu {formatNumber(goals.kcal)} kcal).
        </p>
      )}
      {splitChanged && (
        <p>
          Fördelningen blir {formatNumber(s.proteinPct)} / {formatNumber(s.carbsPct)} / {formatNumber(s.fatPct)} % protein,
          kolhydrater och fett.
        </p>
      )}
    </div>
  )
}

/** Ändra en enda inställning från profilen. Målet räknas om på samma sätt som i det stora formuläret. */
export function ProfileEditSheet({ field, goals, profile, onClose }: Props) {
  const form = useGoalsForm(goals, profile)
  const save = useSaveGoals()
  const latestWeightKg = useWeights()?.at(-1)?.kg
  const saving = useAction(async (next: Goals, nextProfile: Profile | null) => {
    await save(next, nextProfile)
    onClose()
  }, 'Ändringen kunde inte sparas. Försök igen.')

  // Med ett eget kalorimål påverkar profilen inte målet, men ändringen ska ändå sparas
  const nextProfile = form.result?.profile ?? form.parsedProfile
  const needsProfile = PROFILE_FIELDS.has(field)
  const canSave = form.result !== null && (!needsProfile || nextProfile !== null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (canSave && form.result) void saving.run(form.result.goals, nextProfile)
  }

  return (
    <Sheet title={PROFILE_FIELD_TITLES[field]} onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit}>
        <ProfileFieldEditor field={field} form={form} latestWeightKg={latestWeightKg} />
        {needsProfile && !nextProfile && <p className="hint group-footer">Ange ett rimligt värde. Formeln gäller vuxna från 18 år.</p>}
        <ChangePreview form={form} goals={goals} />
        {saving.error && (
          <p className="error" role="alert">
            {saving.error}
          </p>
        )}
        <button type="submit" className="button-primary" disabled={!canSave || saving.pending}>
          Spara
        </button>
      </form>
    </Sheet>
  )
}
