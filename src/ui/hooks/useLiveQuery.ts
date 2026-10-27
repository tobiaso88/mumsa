import { liveQuery } from 'dexie'
import { useEffect, useState, type DependencyList } from 'react'
import { readSettled, type Settled } from './settled'

/**
 * Kör en databasfråga och uppdaterar resultatet när datan ändras.
 * Ger undefined medan frågan laddar, även efter att deps har ändrats.
 * Om frågan misslyckas kastas felet till närmaste ErrorBoundary.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: DependencyList): T | undefined {
  const [result, setResult] = useState<Settled<T> | null>(null)

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => setResult({ deps, ok: true, value }),
      error: (error: unknown) => setResult({ deps, ok: false, error }),
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps styrs av anroparen
  }, deps)

  return readSettled(result, deps)
}
