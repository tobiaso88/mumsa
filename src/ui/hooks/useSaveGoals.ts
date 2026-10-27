import { saveGoals, saveProfile } from '../../data/settingsRepo'
import type { Goals, Profile } from '../../domain/types'
import { useDb } from '../dbContext'

/** Sparar mål och, om den finns, profilen som målet räknades fram från. */
export function useSaveGoals() {
  const db = useDb()
  return async (goals: Goals, profile: Profile | null) => {
    await saveGoals(db, goals)
    if (profile) await saveProfile(db, profile)
  }
}
