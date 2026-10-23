import { getGoals, getProfile } from '../../data/settingsRepo'
import type { Goals, Profile } from '../../domain/types'
import { useDb } from '../dbContext'
import { useLiveQuery } from './useLiveQuery'

/** undefined medan det laddar, null om inget mål är satt. */
export function useGoals(): Goals | null | undefined {
  const db = useDb()
  return useLiveQuery(() => getGoals(db), [db])
}

export function useProfile(): Profile | null | undefined {
  const db = useDb()
  return useLiveQuery(() => getProfile(db), [db])
}
