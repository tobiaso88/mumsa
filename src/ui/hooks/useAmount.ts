import { useState } from 'react'
import { amountUnits, unitGrams, type AmountUnit } from '../../domain/foods/measures'
import { isValidAmount, nutrientsForAmount } from '../../domain/nutrition/nutrition'
import type { Food } from '../../domain/types'
import { parseNumber, toInputText } from '../format'

export type AmountFood = Pick<Food, 'per100g' | 'servingGrams' | 'measures'>

/** Hur mycket stegknapparna ändrar mängden i varje enhet. */
const STEP: Record<AmountUnit, number> = { g: 10, portion: 0.5, dl: 0.5, msk: 1, tsk: 1, st: 1 }

/** Två decimaler räcker i fältet. Det exakta värdet sparas separat. */
const roundForInput = (n: number) => Math.round(n * 100) / 100

export type AmountOptions = {
  /** Börja i portioner, för livsmedel som oftast loggas som en portion. */
  preferPortions?: boolean
  /** Startmängden är en sparad mängd och ska räknas om vid enhetsbyte, inte ersättas. */
  initialIsSaved?: boolean
}

/** Mängd i gram, hushållsmått eller portioner. Räknar fram gram och näring via domain/. */
export function useAmount(food: AmountFood, initialGrams: number, { preferPortions = false, initialIsSaved = false }: AmountOptions = {}) {
  const units = amountUnits(food)
  // En portion som startvärde, om livsmedlet har en portionsstorlek
  const startInPortions = preferPortions && units.includes('portion')
  const [unit, setUnitState] = useState<AmountUnit>(startInPortions ? 'portion' : 'g')
  const [amount, setAmountText] = useState(startInPortions ? '1' : toInputText(initialGrams))
  // Exakt mängd efter ett enhetsbyte, så att avrundningen i fältet inte ändrar det som sparas.
  // Nollställs så fort användaren skriver något själv.
  const [exactGrams, setExactGrams] = useState<number | null>(null)
  // Sant när mängden är användarens egen, inskriven eller sparad. Annars är startmängden
  // bara ett förslag och ett enhetsbyte ger ett jämnt värde, t.ex. 1 dl.
  const [touched, setTouched] = useState(initialIsSaved)

  // Livsmedlet kan laddas om utan enheten, t.ex. om det ändras. Då gäller gram.
  const activeUnit = units.includes(unit) ? unit : 'g'
  const perUnit = unitGrams(food, activeUnit) ?? 1
  const value = parseNumber(amount)
  const grams = exactGrams ?? value * perUnit
  const valid = isValidAmount(grams)
  const preview = valid ? nutrientsForAmount(food.per100g, grams) : null

  const setAmount = (text: string) => {
    setExactGrams(null)
    setTouched(true)
    setAmountText(text)
  }

  const setUnit = (next: AmountUnit) => {
    if (next === activeUnit) return
    const nextPerUnit = unitGrams(food, next)
    if (!touched) {
      // Startmängden är bara ett förslag, så 1 dl är rimligare än 100 g omräknat till 2,56 dl
      setAmountText(next === 'g' ? toInputText(initialGrams) : '1')
      setExactGrams(null)
    } else if (valid && nextPerUnit !== null) {
      // Behåll samma mängd när enheten byts
      setAmountText(toInputText(roundForInput(grams / nextPerUnit)))
      setExactGrams(grams)
    }
    setUnitState(next)
  }

  /** Stegknapparna ändrar ett steg åt gången i vald enhet, aldrig under noll. */
  const step = (direction: 1 | -1) => {
    const size = STEP[activeUnit]
    const current = Number.isFinite(value) ? value : 0
    const next = Math.max(0, Math.round((current + direction * size) / size) * size)
    setAmount(toInputText(next))
  }

  return {
    units,
    unit: activeUnit,
    setUnit,
    /** Gram för en av vald enhet, t.ex. 39 för 1 dl havregryn. */
    perUnit,
    amount,
    setAmount,
    step,
    grams: valid ? grams : null,
    preview,
  }
}

export type AmountState = ReturnType<typeof useAmount>
