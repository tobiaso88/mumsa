import { useState } from 'react'
import type { Meal } from '../../domain/types'
import { useAmount, type AmountFood, type AmountOptions } from './useAmount'

export type { AmountFood } from './useAmount'

/** Mängd och vald måltid för en loggpost. */
export function useAmountForm(food: AmountFood, initialGrams: number, initialMeal: Meal, options: AmountOptions = {}) {
  const amount = useAmount(food, initialGrams, options)
  const [meal, setMeal] = useState(initialMeal)
  return { ...amount, meal, setMeal }
}
