import type { Goals } from '../../domain/types'
import { GoalsForm } from '../components/GoalsForm'
import { Loading } from '../components/Loading'
import { NavBar } from '../components/NavBar'
import { useProfile } from '../hooks/useSettings'
import { navigate, toHash } from '../router'

/** Ändra mål och profil. Öppnas från raderna på profilen och går tillbaka dit när målet är sparat. */
export function GoalsScreen({ goals }: { goals: Goals }) {
  const profile = useProfile()
  if (profile === undefined) return <Loading />
  return (
    <main className="screen modal-screen stack">
      <NavBar
        title="Ditt mål"
        leading={
          <a className="nav-bar-button" href={toHash({ name: 'profile' })}>
            Avbryt
          </a>
        }
      />
      <GoalsForm goals={goals} profile={profile} submitLabel="Spara mål" onSaved={() => navigate({ name: 'profile' })} />
    </main>
  )
}
