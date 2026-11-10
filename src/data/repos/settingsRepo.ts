import { toggleFavorite } from '../../domain/foods/favorites'
import type { Goals, Profile } from '../../domain/types'
import type { MumsaDb } from '../db/db'

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

export async function getFavoriteIds(db: MumsaDb): Promise<string[]> {
  const row = await db.settings.get('favorites')
  return row?.key === 'favorites' ? row.value : []
}

export async function saveFavoriteIds(db: MumsaDb, ids: readonly string[]): Promise<void> {
  await db.settings.put({ key: 'favorites', value: [...ids] })
}

/** Lägger till livsmedlet bland favoriterna, eller tar bort det om det redan är en favorit. */
export async function toggleFavoriteId(db: MumsaDb, id: string): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    await saveFavoriteIds(db, toggleFavorite(await getFavoriteIds(db), id))
  })
}
