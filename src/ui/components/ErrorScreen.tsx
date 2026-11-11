import { useState } from 'react'
import { useAction } from '../hooks/useAction'
import { useExport } from '../hooks/useExport'

/**
 * Visas när appen har stött på ett fel den inte kan visa på annat sätt. Datan
 * finns kvar i webbläsaren, och om den går att läsa kan användaren spara en
 * säkerhetskopia innan hen försöker något annat.
 */
export function ErrorScreen() {
  const exporter = useExport()
  const [saved, setSaved] = useState(false)
  const saving = useAction(async () => {
    setSaved(false)
    if (exporter.canShare) {
      if ((await exporter.share()) === 'shared') setSaved(true)
    } else {
      await exporter.download()
      setSaved(true)
    }
  }, 'Datan gick inte att läsa, så ingen säkerhetskopia kunde sparas. Ladda om sidan och försök igen.')

  return (
    <main className="screen stack" role="alert">
      <h1>Något gick fel</h1>
      <p>Appen stötte på ett fel. Din data ligger kvar i webbläsaren och det hjälper ofta att ladda om sidan.</p>
      <p className="hint">Om felet kommer tillbaka kan du spara en säkerhetskopia av din data först.</p>
      <button type="button" className="button-primary" onClick={() => window.location.reload()}>
        Ladda om
      </button>
      <button type="button" className="button-secondary" onClick={() => void saving.run()} disabled={saving.pending}>
        Spara en säkerhetskopia
      </button>
      {saved && (
        <p className="success" role="status">
          Säkerhetskopian är sparad.
        </p>
      )}
      {saving.error && <p className="error">{saving.error}</p>}
    </main>
  )
}
