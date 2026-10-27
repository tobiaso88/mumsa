import { useEffect, useState, type DependencyList } from 'react'
import { readSettled, type Settled } from './settled'

/**
 * Kör en asynkron läsning när deps ändras. Ger undefined medan den laddar och
 * ignorerar svar som kommer efter att deps hunnit ändras. Om läsningen
 * misslyckas kastas felet till närmaste ErrorBoundary.
 */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): T | undefined {
  const [result, setResult] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let cancelled = false
    load().then(
      (value) => {
        if (!cancelled) setResult({ deps, ok: true, value })
      },
      (error: unknown) => {
        if (!cancelled) setResult({ deps, ok: false, error })
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps styrs av anroparen
  }, deps)

  return readSettled(result, deps)
}
