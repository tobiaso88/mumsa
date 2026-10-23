import { useState, type ReactNode } from 'react'
import { createDb, type MumsaDb } from '../data/db'
import { DbContext } from './dbContext'

type Props = {
  /** Används i tester för att ge en egen databas. */
  db?: MumsaDb
  children: ReactNode
}

export function DbProvider({ db, children }: Props) {
  const [instance] = useState(() => db ?? createDb())
  return <DbContext.Provider value={instance}>{children}</DbContext.Provider>
}
