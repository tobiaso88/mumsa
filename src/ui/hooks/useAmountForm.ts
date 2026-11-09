import { useState } from 'react'
import { gramsToPortions, isValidAmount, nutrientsForAmount, portionsToGrams } from '../../domain/nutrition/nutrition'
import type { Meal, Nutrients } from '../../domain/types'
import { parseNumber, toInputText } from '../format'

export type AmountUnit = 'g' | 'portion'

export type AmountFood = {
  per100g: Nutrients
  servingGrams?: number
}

/** Mängd i gram eller portioner och vald måltid. Räknar fram gram och näring via domain/. */
/** Två decimaler räcker i fältet. Det exakta värdet sparas separat. */
const roundForInput = (n: number) => Math.round(n * 100) / 100

export function useAmountForm(food: AmountFood, initialGrams: number, initialMeal: Meal, preferPortions = false) {
  // En portion som startvärde, om livsmedlet har en portionsstorlek
  const startInPortions = preferPortions && !!food.servingGrams
  const [unit, setUnitState] = useState<AmountUnit>(startInPortions ? 'portion' : 'g')
  const [amount, setAmountText] = useState(startInPortions ? '1' : toInputText(initialGrams))
  // Exakt mängd efter ett enhetsbyte, så att avrundningen i fältet inte ändrar det som sparas.
  // Nollställs så fort användaren skriver något själv.
  const [exactGrams, setExactGrams] = useState<number | null>(null)
  const [meal, setMeal] = useState(initialMeal)

  const value = parseNumber(amount)
  const grams = exactGrams ?? (unit === 'portion' ? portionsToGrams(food, value) : value)
  const valid = isValidAmount(grams)
  const preview = valid ? nutrientsForAmount(food.per100g, grams) : null

  const setAmount = (text: string) => {
    setExactGrams(null)
    setAmountText(text)
  }

  const setUnit = (next: AmountUnit) => {
    if (next === unit) return
    // Behåll samma mängd när enheten byts
    if (valid && food.servingGrams) {
      const converted = next === 'portion' ? gramsToPortions(food, grams) : grams
      if (converted !== null) {
        setAmountText(toInputText(roundForInput(converted)))
        setExactGrams(grams)
      }
    }
    setUnitState(next)
  }

  /** Stegknapparna: 10 g eller en halv portion åt gången, aldrig under noll. */
  const step = (direction: 1 | -1) => {
    const size = unit === 'portion' ? 0.5 : 10
    const current = Number.isFinite(value) ? value : 0
    const next = Math.max(0, Math.round((current + direction * size) / size) * size)
    setAmount(toInputText(next))
  }

  return {
    unit,
    step,
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
