import { useState } from 'react'
import { gramsToPortions, isValidAmount, nutrientsForAmount, portionsToGrams } from '../../domain/nutrition'
import type { Meal, Nutrients } from '../../domain/types'
import { parseNumber, toInputText } from '../format'

export type AmountUnit = 'g' | 'portion'

export type AmountFood = {
  per100g: Nutrients
  servingGrams?: number
}

/** Mängd i gram eller portioner och vald måltid. Räknar fram gram och näring via domain/. */
export function useAmountForm(food: AmountFood, initialGrams: number, initialMeal: Meal) {
  const [unit, setUnitState] = useState<AmountUnit>('g')
  const [amount, setAmount] = useState(toInputText(initialGrams))
  const [meal, setMeal] = useState(initialMeal)

  const value = parseNumber(amount)
  const grams = unit === 'portion' ? portionsToGrams(food, value) : value
  const valid = isValidAmount(grams)
  const preview = valid ? nutrientsForAmount(food.per100g, grams) : null

  const setUnit = (next: AmountUnit) => {
    if (next === unit) return
    // Behåll samma mängd när enheten byts
    if (valid && food.servingGrams) {
      const converted = next === 'portion' ? gramsToPortions(food, grams) : grams
      if (converted !== null) setAmount(toInputText(Math.round(converted * 100) / 100))
    }
    setUnitState(next)
  }

  return {
    unit,
    setUnit,
    amount,
    setAmount,
    meal,
    setMeal,
    grams: valid ? grams : null,
    preview,
    canUsePortions: !!food.servingGrams,
  }
}
