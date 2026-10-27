import { createContext, useContext } from 'react'
import type { IsoDate } from '../domain/types'

export const TodayContext = createContext<IsoDate | null>(null)

/** Dagens datum. Byts vid midnatt, så att en app som ligger öppen inte fastnar på gårdagen. */
export function useToday(): IsoDate {
  const today = useContext(TodayContext)
  if (!today) throw new Error('useToday måste användas inom TodayProvider.')
  return today
}
