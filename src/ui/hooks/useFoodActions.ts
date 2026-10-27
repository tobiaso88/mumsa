import { createCustomFood, deleteCustomFood, updateCustomFood, type CustomFoodInput } from '../../data/foodsRepo'
import { useDb } from '../dbContext'

/** Skrivningar för egna livsmedel, bundna till appens databas. */
export function useFoodActions() {
  const db = useDb()
  return {
    create: (input: CustomFoodInput) => createCustomFood(db, input),
    update: (id: string, input: CustomFoodInput) => updateCustomFood(db, id, input),
    remove: (id: string) => deleteCustomFood(db, id),
  }
}
