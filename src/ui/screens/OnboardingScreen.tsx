import { GoalsForm } from '../components/GoalsForm'
import { toHash } from '../router'

export function OnboardingScreen() {
  return (
    <main className="screen stack">
      <header>
        <h1>Välkommen till Mumsa</h1>
        <p className="lead">
          Börja med att sätta ett dagligt mål. Allt du loggar sparas bara i den här webbläsaren, utan konto.
        </p>
      </header>
      <GoalsForm goals={null} profile={null} submitLabel="Kom igång" />
      <a className="button-secondary" href={toHash({ name: 'settings' })}>
        Flytta från en annan enhet? Importera en säkerhetskopia
      </a>
    </main>
  )
}
