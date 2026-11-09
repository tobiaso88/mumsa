import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { isValidBarcode, normalizeBarcode } from '../../domain/foods/barcode'
import { useBarcodeLookup } from '../hooks/useBarcodeLookup'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { Icon } from '../components/Icon'
import { ScanStatus, type ScanPhase } from '../components/ScanStatus'
import { navigate, toHash, type AddContext } from '../router'

const ERROR_TEXTS = {
  offline: 'Du är offline. Nya produkter kan bara hämtas med internet.',
  unreachable: 'Open Food Facts gick inte att nå just nu. Försök igen om en stund.',
}

export function ScanScreen({ date, meal }: AddContext) {
  const lookupBarcode = useBarcodeLookup()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<ScanPhase>({ kind: 'scanning' })
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
    <main className="scan-screen">
      <div className="scan-camera">
        {phase.kind === 'scanning' && (
          <>
            <video ref={videoRef} muted playsInline aria-label="Kamerabild" hidden={!!cameraError} />
            {!cameraError && <span className="viewfinder" aria-hidden="true" />}
            <p className={cameraError ? 'scan-hint scan-error' : 'scan-hint'}>{cameraError ?? 'Håll streckkoden inom ramen'}</p>
          </>
        )}
      </div>
      <header className="scan-header">
        <a className="round-button dark" href={toHash({ name: 'add', date, meal })} aria-label="Tillbaka">
          <Icon name="close" size={22} strokeWidth={2.2} />
        </a>
        <h1>Skanna streckkod</h1>
        <span className="scan-header-spacer" />
      </header>
      <div className="scan-sheet stack">
        <ScanStatus phase={phase} date={date} meal={meal} onRetry={(code) => void lookup(code)} onRescan={() => setPhase({ kind: 'scanning' })} />
        <form onSubmit={handleManual}>
          <label className="scan-label" htmlFor={manualId}>
            Eller skriv in streckkoden
          </label>
          <div className="manual-barcode">
            <input
              id={manualId}
              className="search-input"
              inputMode="numeric"
              autoComplete="off"
              placeholder="t.ex. 7310865004703"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
            />
            <button type="submit" className="button-primary">
              Sök
            </button>
          </div>
          <p className="hint">Produkter hämtas från Open Food Facts och sparas sedan på enheten.</p>
        </form>
      </div>
    </main>
  )
}
