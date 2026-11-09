import { useState } from 'react'
import { macroGrams } from '../../domain/goals/goals'
import { isCalculatedGoal, PACE_KG_PER_WEEK } from '../../domain/goals/objectives'
import type { Goals, Profile } from '../../domain/types'
import { Icon } from '../components/Icon'
import { ListGroup, type ListRow } from '../components/ListGroup'
import { Loading } from '../components/Loading'
import { ProfileEditSheet } from '../components/ProfileEditSheet'
import { formatNumber } from '../format'
import { useProfile } from '../hooks/useSettings'
import { ACTIVITY_SHORT_LABELS, OBJECTIVE_LABELS, PROFILE_FIELD_TITLES, SEX_LABELS, type ProfileField } from '../labels'
import { toHash } from '../router'

function GoalCard({ goals, calculated }: { goals: Goals; calculated: boolean }) {
  const grams = macroGrams(goals.kcal, goals.split)
  const macros = [
    { label: 'Protein', pct: goals.split.proteinPct, grams: grams.protein, color: 'var(--protein)' },
    { label: 'Kolhydrater', pct: goals.split.carbsPct, grams: grams.carbs, color: 'var(--carbs)' },
    { label: 'Fett', pct: goals.split.fatPct, grams: grams.fat, color: 'var(--fat)' },
  ]
  return (
    <section className="card stat-card" aria-label="Ditt dagliga mål">
      <div className="goal-headline">
        <span className="hint">Dagligt mål</span>
        <span className="goal-kcal">
          {formatNumber(goals.kcal)} <span>kcal</span>
        </span>
      </div>
      <div className="split-bar" aria-hidden="true">
        {macros.map((m) => (
          <span key={m.label} style={{ flexGrow: m.pct, background: m.color }} />
        ))}
      </div>
      <dl className="split-legend">
        {macros.map((m) => (
          <div key={m.label}>
            <dt>
              <span className="dot" style={{ background: m.color }} />
              {m.label}
            </dt>
            <dd>
              {formatNumber(m.pct)} % · {formatNumber(m.grams)} g
            </dd>
          </div>
        ))}
      </dl>
      <p className="hint">
        {calculated ? 'Uppskattat med en standardformel. Det är inte ett medicinskt råd.' : 'Ett mål som du har angett själv.'}
      </p>
    </section>
  )
}

type Open = (field: ProfileField) => void

function goalRows(goals: Goals, profile: Profile | null, open: Open): ListRow[] {
  const objective = goals.objective ?? { kind: 'maintain' as const }
  const calculated = isCalculatedGoal(goals, profile)
  const row = (field: ProfileField, value: string): ListRow => ({ label: PROFILE_FIELD_TITLES[field], value, onClick: () => open(field) })
  const { proteinPct, carbsPct, fatPct } = goals.split
  return [
    row('mode', calculated ? 'Räkna ut åt mig' : 'Ange själv'),
    ...(calculated ? [] : [row('kcal', `${formatNumber(goals.kcal)} kcal`)]),
    row('objective', OBJECTIVE_LABELS[objective.kind]),
    ...(objective.kind === 'maintain' ? [] : [row('pace', `${formatNumber(PACE_KG_PER_WEEK[objective.pace], 2)} kg/vecka`)]),
    ...(objective.kind === 'maintain'
      ? []
      : [row('targetWeight', goals.targetWeightKg !== undefined ? `${formatNumber(goals.targetWeightKg, 1)} kg` : 'Ingen')]),
    row('split', `${formatNumber(proteinPct)} / ${formatNumber(carbsPct)} / ${formatNumber(fatPct)} %`),
  ]
}

function profileRows(profile: Profile, open: Open): ListRow[] {
  const row = (field: ProfileField, value: string): ListRow => ({ label: PROFILE_FIELD_TITLES[field], value, onClick: () => open(field) })
  return [
    row('sex', SEX_LABELS[profile.sex]),
    row('age', `${formatNumber(profile.ageYears)} år`),
    row('height', `${formatNumber(profile.heightCm)} cm`),
    row('weight', `${formatNumber(profile.weightKg, 1)} kg`),
    row('activity', ACTIVITY_SHORT_LABELS[profile.activity]),
  ]
}

export function ProfileScreen({ goals }: { goals: Goals }) {
  const profile = useProfile()
  const [editing, setEditing] = useState<ProfileField | null>(null)
  if (profile === undefined) return <Loading />
  return (
    <main className="screen stack">
      <header className="large-title">
        <h1>Profil</h1>
        <a className="round-button" href={toHash({ name: 'settings' })} aria-label="Inställningar och data">
          <Icon name="settings" size={22} />
        </a>
      </header>
      <GoalCard goals={goals} calculated={isCalculatedGoal(goals, profile)} />
      <ListGroup title="Ditt mål" rows={goalRows(goals, profile, setEditing)} />
      {profile && <ListGroup title="Om dig" rows={profileRows(profile, setEditing)} />}
      {editing && <ProfileEditSheet field={editing} goals={goals} profile={profile} onClose={() => setEditing(null)} />}
    </main>
  )
}
