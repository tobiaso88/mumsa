import { useState } from 'react'
import type { CustomFoodInput } from '../../data/foodsRepo'
import { kcalLooksOff, nutrientIssues } from '../../domain/foodValidation'
import type { Food, Nutrients } from '../../domain/types'
import { parseNumber, toInputText } from '../format'

export type FoodFormFields = {
  name: string
  brand: string
  barcode: string
  kcal: string
  protein: string
  carbs: string
  fat: string
  servingGrams: string
  servingLabel: string
}

export type FoodFormInitial = Partial<Pick<Food, 'name' | 'brand' | 'barcode' | 'per100g' | 'servingGrams' | 'servingLabel'>>

function initialFields(food: FoodFormInitial): FoodFormFields {
  return {
    name: food.name ?? '',
    brand: food.brand ?? '',
    barcode: food.barcode ?? '',
    kcal: toInputText(food.per100g?.kcal),
    protein: toInputText(food.per100g?.protein),
    carbs: toInputText(food.per100g?.carbs),
    fat: toInputText(food.per100g?.fat),
    servingGrams: toInputText(food.servingGrams),
    servingLabel: food.servingLabel ?? '',
  }
}

const optionalText = (text: string) => text.trim() || undefined

/** Formulärstate för ett eget livsmedel. Ger input till foodsRepo när allt är giltigt. */
export function useFoodForm(initial: FoodFormInitial) {
  const [fields, setFields] = useState(() => initialFields(initial))
  const set = (key: keyof FoodFormFields, value: string) => setFields((f) => ({ ...f, [key]: value }))

  const per100g: Nutrients = {
    kcal: parseNumber(fields.kcal),
    protein: parseNumber(fields.protein),
    carbs: parseNumber(fields.carbs),
    fat: parseNumber(fields.fat),
  }
  const issues = nutrientIssues(per100g)
  // Visa inga fel innan användaren har börjat fylla i näringen
  const touched = [fields.kcal, fields.protein, fields.carbs, fields.fat].some((f) => f.trim() !== '')
  const serving = fields.servingGrams.trim() === '' ? undefined : parseNumber(fields.servingGrams)
  const servingValid = serving === undefined || (Number.isFinite(serving) && serving > 0)
  const barcode = fields.barcode.replace(/\s/g, '')
  const barcodeValid = barcode === '' || /^\d{6,14}$/.test(barcode)
  const nameValid = fields.name.trim() !== ''

  const input: CustomFoodInput | null =
    nameValid && issues.length === 0 && servingValid && barcodeValid
      ? {
          name: fields.name.trim(),
          brand: optionalText(fields.brand),
          barcode: barcode || undefined,
          per100g,
          servingGrams: serving,
          servingLabel: serving === undefined ? undefined : optionalText(fields.servingLabel),
        }
      : null

  return {
    fields,
    set,
    issues: touched ? issues : [],
    servingValid,
    barcodeValid,
    kcalWarning: issues.length === 0 && kcalLooksOff(per100g),
    input,
  }
}
