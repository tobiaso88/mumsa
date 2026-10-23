import type { Goals } from '../../domain/types'
import { GoalsForm } from '../components/GoalsForm'
import { useProfile } from '../hooks/useSettings'

export function ProfileScreen({ goals }: { goals: Goals }) {
  const profile = useProfile()
  if (profile === undefined) return null
  return (
    <main className="screen stack">
      <h1>Profil och mål</h1>
      <GoalsForm goals={goals} profile={profile} submitLabel="Spara mål" />
    </main>
  )
}
