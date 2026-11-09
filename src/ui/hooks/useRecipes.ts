import { getRecipe, listRecipes } from '../../data/repos/recipesRepo'
import { recipeFoods } from '../../data/sources/foodCatalog'
import type { Food, Recipe } from '../../domain/types'
import { useDb } from '../dbContext'
import { useAsync } from './useAsync'
import { useLiveQuery } from './useLiveQuery'

/** Ett recept. undefined medan det laddar, null om id saknas eller receptet inte finns. */
export function useRecipe(id: string | undefined): Recipe | null | undefined {
  const db = useDb()
  const recipe = useAsync(async () => (id ? ((await getRecipe(db, id)) ?? null) : null), [db, id])
  return id ? recipe : null
}

/** Alla recept som livsmedel, sorterade på namn. undefined medan de laddar. */
export function useRecipeFoods(): Food[] | undefined {
  const db = useDb()
  return useLiveQuery(() => recipeFoods(db), [db])
}

/** Alla recept, sorterade på namn. undefined medan de laddar. */
export function useRecipeList(): Recipe[] | undefined {
  const db = useDb()
  return useLiveQuery(() => listRecipes(db), [db])
}
