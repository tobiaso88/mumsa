import { macroGrams } from '../../domain/goals/goals'
import { PACE_KG_PER_WEEK } from '../../domain/goals/objectives'
import type { Goals, Profile } from '../../domain/types'
import { Icon } from '../components/Icon'
import { ListGroup, type ListRow } from '../components/ListGroup'
import { Loading } from '../components/Loading'
import { formatNumber } from '../format'
import { useProfile } from '../hooks/useSettings'
import { ACTIVITY_SHORT_LABELS, OBJECTIVE_LABELS, SEX_LABELS } from '../labels'
import { toHash } from '../router'

const EDIT = toHash({ name: 'goals' })

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

function goalRows(goals: Goals, profile: Profile | null): ListRow[] {
  const objective = goals.objective ?? { kind: 'maintain' as const }
  const rows: ListRow[] = [
    { label: 'Målet sätts', value: profile ? 'Räkna ut åt mig' : 'Ange själv', href: EDIT },
    { label: 'Vad vill du uppnå?', value: OBJECTIVE_LABELS[objective.kind], href: EDIT },
  ]
  if (objective.kind !== 'maintain') {
    rows.push({ label: 'Takt', value: `${formatNumber(PACE_KG_PER_WEEK[objective.pace], 2)} kg/vecka`, href: EDIT })
  }
  if (goals.targetWeightKg !== undefined) {
    rows.push({ label: 'Målvikt', value: `${formatNumber(goals.targetWeightKg, 1)} kg`, href: EDIT })
  }
  return rows
}

function profileRows(profile: Profile): ListRow[] {
  return [
    { label: 'Kön', value: SEX_LABELS[profile.sex], href: EDIT },
    { label: 'Ålder', value: `${formatNumber(profile.ageYears)} år`, href: EDIT },
    { label: 'Längd', value: `${formatNumber(profile.heightCm)} cm`, href: EDIT },
    { label: 'Aktivitetsnivå', value: ACTIVITY_SHORT_LABELS[profile.activity], href: EDIT },
  ]
}

export function ProfileScreen({ goals }: { goals: Goals }) {
  const profile = useProfile()
  if (profile === undefined) return <Loading />
  return (
    <main className="screen stack">
      <header className="large-title">
        <h1>Profil</h1>
        <a className="round-button" href={toHash({ name: 'settings' })} aria-label="Inställningar och data">
          <Icon name="settings" size={22} />
        </a>
      </header>
      <GoalCard goals={goals} calculated={profile !== null} />
      <ListGroup title="Ditt mål" rows={goalRows(goals, profile)} />
      {profile && <ListGroup title="Om dig" rows={profileRows(profile)} />}
    </main>
  )
}
