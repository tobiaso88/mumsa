import { AboutSection } from '../components/AboutSection'
import { BackupSection } from '../components/BackupSection'
import { StorageSection } from '../components/StorageSection'
import { toHash } from '../router'

export function SettingsScreen() {
  return (
    <main className="screen stack">
      <header>
        <a className="hint" href={toHash({ name: 'profile' })}>
          ‹ Profil
        </a>
        <h1>Inställningar och data</h1>
      </header>
      <StorageSection />
      <BackupSection />
      <AboutSection />
    </main>
  )
}
