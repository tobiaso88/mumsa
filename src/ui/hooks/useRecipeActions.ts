import { createRecipe, deleteRecipe, updateRecipe, type RecipeInput } from '../../data/repos/recipesRepo'
import { useDb } from '../dbContext'

/** Skrivningar för recept, bundna till appens databas. */
export function useRecipeActions() {
  const db = useDb()
  return {
    create: (input: RecipeInput) => createRecipe(db, input),
    update: (id: string, input: RecipeInput) => updateRecipe(db, id, input),
    remove: (id: string) => deleteRecipe(db, id),
  }
}
