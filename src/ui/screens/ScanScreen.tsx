import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { isValidBarcode, normalizeBarcode } from '../../domain/barcode'
import { useBarcodeLookup } from '../hooks/useBarcodeLookup'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { navigate, toHash, type AddContext } from '../router'

type Phase =
  | { kind: 'scanning' }
  | { kind: 'looking'; code: string }
  | { kind: 'notFound'; code: string }
  | { kind: 'failed'; code: string; message: string }

const ERROR_TEXTS = {
  offline: 'Du är offline. Nya produkter kan bara hämtas med internet.',
  unreachable: 'Open Food Facts gick inte att nå just nu. Försök igen om en stund.',
}

export function ScanScreen({ date, meal }: AddContext) {
  const lookupBarcode = useBarcodeLookup()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' })
  const [manual, setManual] = useState('')
  const manualId = useId()
  const busy = useRef(false)
  const pendingLookup = useRef<AbortController | null>(null)
  const cameraError = useBarcodeScanner(videoRef, phase.kind === 'scanning', (code) => void lookup(code))

  // Ett uppslag som pågår när användaren lämnar vyn ska inte flytta hen tillbaka när svaret kommer
  useEffect(() => () => pendingLookup.current?.abort(), [])

  async function lookup(raw: string) {
    const code = normalizeBarcode(raw)
    // Kameran kan rapportera samma kod flera gånger innan vyn hunnit byta läge
    if (!isValidBarcode(code) || busy.current) return
    busy.current = true
    const controller = new AbortController()
    pendingLookup.current = controller
    setPhase({ kind: 'looking', code })
    try {
      const result = await lookupBarcode(code, controller.signal)
      if (controller.signal.aborted) return
      if (result.kind === 'found') navigate({ name: 'add', date, meal, foodId: result.food.id })
      else if (result.kind === 'notFound') setPhase({ kind: 'notFound', code })
      else setPhase({ kind: 'failed', code, message: ERROR_TEXTS[result.kind] })
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
          <a className="button-secondary" href={toHash({ name: 'food', action: 'new', date, meal, barcode: phase.code })}>
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
        <label className="label" htmlFor={manualId}>
          Eller skriv in streckkoden
        </label>
        <div className="manual-barcode">
          <input
            id={manualId}
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
