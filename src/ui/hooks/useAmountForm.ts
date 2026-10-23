import { useState } from 'react'
import { nutrientsForAmount, portionsToGrams } from '../../domain/nutrition'
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
  const valid = grams !== null && Number.isFinite(grams) && grams > 0 && grams <= 10000
  const preview = valid ? nutrientsForAmount(food.per100g, grams) : null

  const setUnit = (next: AmountUnit) => {
    if (next === unit) return
    // Behåll samma mängd när enheten byts
    const serving = food.servingGrams
    if (valid && serving) {
      const converted = next === 'portion' ? grams / serving : grams
      setAmount(toInputText(Math.round(converted * 100) / 100))
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
