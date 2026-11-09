import { AboutSection } from '../components/AboutSection'
import { BackupSection } from '../components/BackupSection'
import { Icon } from '../components/Icon'
import { StorageSection } from '../components/StorageSection'
import { toHash } from '../router'

export function SettingsScreen() {
  return (
    <main className="screen stack">
      <header>
        <a className="back-link" href={toHash({ name: 'profile' })}>
          <Icon name="chevronLeft" size={26} strokeWidth={2.4} />
          Profil
        </a>
        <h1>Inställningar</h1>
      </header>
      <StorageSection />
      <BackupSection />
      <AboutSection />
    </main>
  )
}
