import type { DependencyList } from 'react'

/** Resultatet av en asynkron läsning, märkt med de deps det hör till. */
export type Settled<T> = { deps: DependencyList } & ({ ok: true; value: T } | { ok: false; error: unknown })

function sameDeps(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
}

/**
 * Ger värdet om det hör till aktuella deps, annars undefined. Fel kastas i
 * renderingen så att närmaste ErrorBoundary visar dem för användaren.
 */
export function readSettled<T>(result: Settled<T> | null, deps: DependencyList): T | undefined {
  if (!result || !sameDeps(result.deps, deps)) return undefined
  if (!result.ok) throw result.error
  return result.value
}
