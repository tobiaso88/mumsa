import { findFood } from '../../data/foodCatalog'
import type { Food } from '../../domain/types'
import { useDb } from '../dbContext'
import { useAsync } from './useAsync'

/** Ett livsmedel oavsett källa. undefined medan det laddar, null om id saknas eller livsmedlet inte finns. */
export function useFood(id: string | undefined): Food | null | undefined {
  const db = useDb()
  const food = useAsync(async () => (id ? ((await findFood(db, id)) ?? null) : null), [db, id])
  return id ? food : null
}
