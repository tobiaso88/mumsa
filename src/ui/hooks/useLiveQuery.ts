import { liveQuery } from 'dexie'
import { useEffect, useState, type DependencyList } from 'react'

function sameDeps(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
}

/**
 * Kör en databasfråga och uppdaterar resultatet när datan ändras.
 * Ger undefined medan frågan laddar, även efter att deps har ändrats.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: DependencyList): T | undefined {
  const [result, setResult] = useState<{ deps: DependencyList; value: T } | null>(null)

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => setResult({ deps, value }),
      error: (error: unknown) => console.error(error),
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps styrs av anroparen
  }, deps)

  return result && sameDeps(result.deps, deps) ? result.value : undefined
}
