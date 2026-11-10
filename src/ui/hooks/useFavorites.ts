import { getFavoriteIds, toggleFavoriteId } from '../../data/repos/settingsRepo'
import { findFoods } from '../../data/sources/foodCatalog'
import type { Food } from '../../domain/types'
import { useDb } from '../dbContext'
import { useAsync } from './useAsync'
import { useLiveQuery } from './useLiveQuery'

/** Id:n på favoriterna i den ordning de lades till. undefined medan de laddas. */
export function useFavoriteIds(): string[] | undefined {
  const db = useDb()
  return useLiveQuery(() => getFavoriteIds(db), [db])
}

/**
 * Favoritlivsmedlen. Som useRecentFoods bevakas id:n i databasen medan
 * uppslaget görs utanför, eftersom det även läser den buntade filen.
 * Favoriter som inte längre finns, till exempel ett borttaget eget livsmedel, hoppas över.
 */
export function useFavoriteFoods(): Food[] | undefined {
  const db = useDb()
  const ids = useFavoriteIds()
  const foods = useAsync(async () => (ids ? findFoods(db, ids) : undefined), [db, ids])
  return ids ? foods : undefined
}

export function useFavoriteActions() {
  const db = useDb()
  return { toggle: (foodId: string) => toggleFavoriteId(db, foodId) }
}
