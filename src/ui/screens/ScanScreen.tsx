import { useRef, useState, type FormEvent } from 'react'
import { lookupBarcode } from '../../data/foodCatalog'
import { OffError } from '../../data/openFoodFacts'
import { useDb } from '../dbContext'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { navigate, toHash, type AddContext } from '../router'

type Phase =
  | { kind: 'scanning' }
  | { kind: 'looking'; code: string }
  | { kind: 'notFound'; code: string }
  | { kind: 'failed'; code: string; message: string }

function errorText(error: unknown): string {
  if (error instanceof OffError && error.kind === 'offline') return 'Du är offline. Nya produkter kan bara hämtas med internet.'
  return 'Open Food Facts gick inte att nå just nu. Försök igen om en stund.'
}

export function ScanScreen({ date, meal }: AddContext) {
  const db = useDb()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' })
  const [manual, setManual] = useState('')
  const busy = useRef(false)
  const cameraError = useBarcodeScanner(videoRef, phase.kind === 'scanning', (code) => void lookup(code))

  async function lookup(raw: string) {
    const code = raw.replace(/\s/g, '')
    // Kameran kan rapportera samma kod flera gånger innan vyn hunnit byta läge
    if (!/^\d{6,14}$/.test(code) || busy.current) return
    busy.current = true
    setPhase({ kind: 'looking', code })
    try {
      const food = await lookupBarcode(db, code)
      if (food) navigate({ name: 'add', date, meal, foodId: food.id })
      else setPhase({ kind: 'notFound', code })
    } catch (error) {
      setPhase({ kind: 'failed', code, message: errorText(error) })
    } finally {
      busy.current = false
    }
  }

  function handleManual(e: FormEvent) {
    e.preventDefault()
    void lookup(manual)
  }

  return (
    <main className="screen stack">
      <h1>Skanna streckkod</h1>
      {phase.kind === 'scanning' && (
        <div className="scanner">
          <video ref={videoRef} muted playsInline aria-label="Kamerabild" hidden={!!cameraError} />
          {cameraError ? <p className="error">{cameraError}</p> : <p className="hint">Håll streckkoden inom bilden.</p>}
        </div>
      )}
      {phase.kind === 'looking' && <p role="status">Söker efter {phase.code} …</p>}
      {phase.kind === 'notFound' && (
        <div className="card">
          <p>Produkten {phase.code} finns inte i Open Food Facts, eller saknar näringsvärden.</p>
          <a className="button-secondary" href={toHash({ name: 'food', action: 'new', date, meal, ref: phase.code })}>
            Skapa eget livsmedel
          </a>
        </div>
      )}
      {phase.kind === 'failed' && (
        <div className="card">
          <p className="error">{phase.message}</p>
          <button type="button" className="button-secondary" onClick={() => void lookup(phase.code)}>
            Försök igen
          </button>
        </div>
      )}
      {phase.kind !== 'scanning' && (
        <button type="button" className="button-secondary" onClick={() => setPhase({ kind: 'scanning' })}>
          Skanna igen
        </button>
      )}
      <form className="card" onSubmit={handleManual}>
        <label className="label" htmlFor="manual-barcode">
          Eller skriv in streckkoden
        </label>
        <div className="manual-barcode">
          <input
            id="manual-barcode"
            className="search-input"
            inputMode="numeric"
            autoComplete="off"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button type="submit" className="button-primary">
            Sök
          </button>
        </div>
      </form>
      <a className="button-secondary" href={toHash({ name: 'add', date, meal })}>
        Tillbaka
      </a>
    </main>
  )
}
