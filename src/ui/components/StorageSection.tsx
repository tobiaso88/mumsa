import { usePersistentStorage } from '../hooks/usePersistentStorage'

export function StorageSection() {
  const { persisted, request } = usePersistentStorage()
  return (
    <section className="card stack" aria-labelledby="storage-title">
      <h2 id="storage-title">Din data</h2>
      <p className="hint">
        Allt du loggar sparas bara i den här webbläsaren på den här enheten. Inget konto, ingen synk och ingen statistik
        skickas någonstans. Det enda appen hämtar från internet är produkter när du skannar en streckkod, från Open Food
        Facts.
      </p>
      <p className="hint">
        Om du rensar webbplatsdata i webbläsaren försvinner loggen. Exportera en säkerhetskopia då och då.
      </p>
      {persisted === true && <p className="success">Lagringen är beständig och rensas inte automatiskt.</p>}
      {persisted === false && (
        <>
          <p className="hint">Webbläsaren kan rensa datan om utrymmet tar slut.</p>
          <button type="button" className="button-secondary" onClick={() => void request()}>
            Be om beständig lagring
          </button>
        </>
      )}
    </section>
  )
}
