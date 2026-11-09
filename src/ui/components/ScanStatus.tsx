import type { IsoDate, Meal } from '../../domain/types'
import { toHash } from '../router'

export type ScanPhase =
  | { kind: 'scanning' }
  | { kind: 'looking'; code: string }
  | { kind: 'notFound'; code: string }
  | { kind: 'failed'; code: string; message: string }

type Props = {
  phase: ScanPhase
  date: IsoDate
  meal: Meal
  onRetry: (code: string) => void
  onRescan: () => void
}

/** Läget för ett uppslag: söker, hittades inte eller misslyckades. Visas inte medan kameran letar. */
export function ScanStatus({ phase, date, meal, onRetry, onRescan }: Props) {
  if (phase.kind === 'scanning') return null
  return (
    <div className="scan-status">
      {phase.kind === 'looking' && <p role="status">Söker efter {phase.code} …</p>}
      {phase.kind === 'notFound' && (
        <>
          <p>Produkten {phase.code} finns inte i Open Food Facts, eller saknar näringsvärden.</p>
          <a className="button-primary" href={toHash({ name: 'food', action: 'new', date, meal, barcode: phase.code })}>
            Skapa eget livsmedel
          </a>
        </>
      )}
      {phase.kind === 'failed' && (
        <>
          <p className="error">{phase.message}</p>
          <button type="button" className="button-primary" onClick={() => onRetry(phase.code)}>
            Försök igen
          </button>
        </>
      )}
      <button type="button" className="button-secondary" onClick={onRescan}>
        Skanna igen
      </button>
    </div>
  )
}
