import type { Goals, Profile } from '../domain/types'
import type { MumsaDb } from './db'

export async function getGoals(db: MumsaDb): Promise<Goals | null> {
  const row = await db.settings.get('goals')
  return row?.key === 'goals' ? row.value : null
}

export async function saveGoals(db: MumsaDb, goals: Goals): Promise<void> {
  await db.settings.put({ key: 'goals', value: goals })
}

export async function getProfile(db: MumsaDb): Promise<Profile | null> {
  const row = await db.settings.get('profile')
  return row?.key === 'profile' ? row.value : null
}

export async function saveProfile(db: MumsaDb, profile: Profile): Promise<void> {
  await db.settings.put({ key: 'profile', value: profile })
}
