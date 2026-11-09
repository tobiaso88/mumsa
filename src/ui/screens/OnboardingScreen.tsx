import { useState } from 'react'
import { AppIcon } from '../components/AppIcon'
import { GoalsForm } from '../components/GoalsForm'
import { Icon, type IconName } from '../components/Icon'
import { toHash } from '../router'

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'search', title: 'Sök bland 2 500 basvaror', text: 'Livsmedelsverkets databas finns i appen och fungerar offline.' },
  { icon: 'scan', title: 'Skanna streckkoden', text: 'Förpackade varor hämtas från Open Food Facts.' },
  { icon: 'lock', title: 'Inget konto', text: 'Allt sparas bara på den här enheten. Ingen reklam, ingen betalvägg.' },
]

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="screen welcome-screen">
      <header className="welcome">
        <AppIcon />
        <h1>Välkommen till Mumsa</h1>
        <p className="lead">En enkel matlogg som stannar på din telefon.</p>
      </header>
      <ul className="feature-list">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className="feature-icon">
              <Icon name={f.icon} />
            </span>
            <div>
              <strong>{f.title}</strong>
              <span>{f.text}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="welcome-actions">
        <button type="button" className="button-primary" onClick={onStart}>
          Kom igång
        </button>
        <a className="text-button" href={toHash({ name: 'settings' })}>
          Flytta från en annan enhet? Importera en säkerhetskopia
        </a>
      </div>
    </main>
  )
}

/** Första besöket: en välkomstskärm och sedan målet. */
export function OnboardingScreen() {
  const [step, setStep] = useState<'welcome' | 'goals'>('welcome')
  if (step === 'welcome') return <Welcome onStart={() => setStep('goals')} />
  return (
    <main className="screen stack">
      <button type="button" className="back-link" onClick={() => setStep('welcome')}>
        <Icon name="chevronLeft" size={26} strokeWidth={2.4} />
        Tillbaka
      </button>
      <header>
        <h1>Ditt mål</h1>
        <p className="lead">Sätt ett dagligt mål. Allt du loggar sparas bara i den här webbläsaren, utan konto.</p>
      </header>
      <GoalsForm goals={null} profile={null} submitLabel="Kom igång" />
    </main>
  )
}
