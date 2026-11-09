import type { Goals } from '../../domain/types'
import { GoalsForm } from '../components/GoalsForm'
import { Icon } from '../components/Icon'
import { Loading } from '../components/Loading'
import { useProfile } from '../hooks/useSettings'
import { toHash } from '../router'

export function ProfileScreen({ goals }: { goals: Goals }) {
  const profile = useProfile()
  if (profile === undefined) return <Loading />
  return (
    <main className="screen stack">
      <header className="large-title">
        <h1>Profil och mål</h1>
        <a className="round-button" href={toHash({ name: 'settings' })} aria-label="Inställningar och data">
          <Icon name="settings" size={22} />
        </a>
      </header>
      <GoalsForm goals={goals} profile={profile} submitLabel="Spara mål" />
    </main>
  )
}
