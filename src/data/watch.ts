import { liveQuery } from 'dexie'

export type Unwatch = () => void

export type WatchHandlers<T> = {
  next: (value: T) => void
  error: (error: unknown) => void
}

/**
 * Kör en läsning mot databasen och kör den igen när datan den läste ändras.
 * Returnerar en funktion som slutar bevaka.
 */
export function watch<T>(query: () => Promise<T>, handlers: WatchHandlers<T>): Unwatch {
  const subscription = liveQuery(query).subscribe(handlers)
  return () => subscription.unsubscribe()
}
