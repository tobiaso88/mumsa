import { createContext, useContext } from 'react'
import type { MumsaDb } from '../data/db'

export const DbContext = createContext<MumsaDb | null>(null)

export function useDb(): MumsaDb {
  const db = useContext(DbContext)
  if (!db) throw new Error('useDb måste användas inom DbProvider.')
  return db
}
