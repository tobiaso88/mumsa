import { useEffect, useState, type DependencyList } from 'react'
import { watch } from '../../data/watch'
import { readSettled, type Settled } from './settled'

/**
 * Kör en databasfråga och uppdaterar resultatet när datan ändras.
 * Ger undefined medan frågan laddar, även efter att deps har ändrats.
 * Om frågan misslyckas kastas felet till närmaste ErrorBoundary.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: DependencyList): T | undefined {
  const [result, setResult] = useState<Settled<T> | null>(null)

  useEffect(() => {
    return watch(query, {
      next: (value) => setResult({ deps, ok: true, value }),
      error: (error) => setResult({ deps, ok: false, error }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps styrs av anroparen
  }, deps)

  return readSettled(result, deps)
}
