import { AppIcon } from '../components/AppIcon'
import { GoalsForm } from '../components/GoalsForm'
import { Icon, type IconName } from '../components/Icon'
import { toHash } from '../router'

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'search', title: 'Sök bland basvarorna', text: 'Livsmedelsverkets databas finns i appen och fungerar offline.' },
  { icon: 'scan', title: 'Skanna streckkoden', text: 'Förpackade varor hämtas från Open Food Facts.' },
  { icon: 'lock', title: 'Inget konto', text: 'Allt sparas bara på den här enheten. Ingen reklam, ingen betalvägg.' },
]

export function OnboardingScreen() {
  return (
    <main className="screen stack">
      <header className="welcome">
        <AppIcon />
        <h1>Välkommen till Mumsa</h1>
        <p className="lead">
          Börja med att sätta ett dagligt mål. Allt du loggar sparas bara i den här webbläsaren, utan konto.
        </p>
      </header>
      <ul className="feature-list">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className="meal-icon">
              <Icon name={f.icon} />
            </span>
            <div>
              <strong>{f.title}</strong>
              <span>{f.text}</span>
            </div>
          </li>
        ))}
      </ul>
      <GoalsForm goals={null} profile={null} submitLabel="Kom igång" />
      <a className="button-secondary" href={toHash({ name: 'settings' })}>
        Flytta från en annan enhet? Importera en säkerhetskopia
      </a>
    </main>
  )
}
