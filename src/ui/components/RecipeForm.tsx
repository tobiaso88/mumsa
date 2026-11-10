import { useState, type FormEvent, type ReactNode } from 'react'
import type { RecipeInput } from '../../data/repos/recipesRepo'
import { MAX_TEXT_LENGTH } from '../../domain/foods/foodValidation'
import type { Recipe } from '../../domain/types'
import { formatNumber } from '../format'
import { useRecipeForm } from '../hooks/useRecipeForm'
import { Icon } from './Icon'
import { IngredientPicker } from './IngredientPicker'
import { NavBar } from './NavBar'
import { NumberField } from './NumberField'
import { NutrientPreview } from './NutrientPreview'
import { TextField } from './TextField'

type Props = {
  title: string
  /** Vart Avbryt leder. */
  cancelHref: string
  initial?: Recipe
  submitLabel: string
  onSubmit: (input: RecipeInput) => void
  /** En knapp under formuläret som också sparar, till exempel för att spara och logga. */
  secondarySubmit?: { label: string; onSubmit: (input: RecipeInput) => void }
  extraActions?: ReactNode
  /** Sant medan formuläret sparas. Stänger av knappen så att inget sparas två gånger. */
  busy?: boolean
  error?: string | null
}

export function RecipeForm({
  title,
  cancelHref,
  initial,
  submitLabel,
  onSubmit,
  secondarySubmit,
  extraActions,
  busy,
  error,
}: Props) {
  const form = useRecipeForm(initial)
  const [picking, setPicking] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (form.input) onSubmit(form.input)
  }

  return (
    <>
      <form className="stack" onSubmit={handleSubmit}>
        <NavBar
          title={title}
          leading={
            <a className="nav-bar-button" href={cancelHref}>
              Avbryt
            </a>
          }
          trailing={
            <button type="submit" className="nav-bar-button strong" aria-label={submitLabel} disabled={!form.input || busy}>
              Spara
            </button>
          }
        />
        <div className="card">
          <TextField label="Namn" value={form.name} onChange={form.setName} maxLength={MAX_TEXT_LENGTH} />
          <NumberField label="Antal portioner" value={form.servings} onChange={form.setServings} invalid={!form.servingsValid} />
        </div>
        <fieldset className="group">
          <legend className="section-title">Ingredienser</legend>
          {form.ingredients.length > 0 && (
            <div className="card">
              {form.ingredients.map((ingredient) => (
                <div key={ingredient.key} className="ingredient-row">
                  <NumberField
                    label={ingredient.foodName}
                    unit="g"
                    value={ingredient.grams}
                    onChange={(grams) => form.setGrams(ingredient.key, grams)}
                    invalid={!form.gramsValid(ingredient.grams)}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Ta bort ${ingredient.foodName}`}
                    onClick={() => form.removeIngredient(ingredient.key)}
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button type="button" className="button-secondary" onClick={() => setPicking(true)} disabled={!form.canAddIngredient}>
            Lägg till ingrediens
          </button>
          {form.ingredients.length === 0 && <p className="hint group-footer">Lägg till minst en ingrediens.</p>}
        </fieldset>
        {form.perServing && form.totalGrams !== null && form.servingGrams !== null && (
          <fieldset className="group">
            <legend className="section-title">Näring per portion</legend>
            <NutrientPreview nutrients={form.perServing} label="Näring per portion" />
            <p className="hint group-footer">
              Totalt {formatNumber(form.totalGrams)} g, vilket blir {formatNumber(form.servingGrams)} g per portion. Räknat på
              ingrediensernas vikt.
            </p>
          </fieldset>
        )}
        <p className="hint group-footer">Sparas bara på den här enheten.</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {secondarySubmit && (
          <button
            type="button"
            className="button-secondary"
            onClick={() => form.input && secondarySubmit.onSubmit(form.input)}
            disabled={!form.input || busy}
          >
            {secondarySubmit.label}
          </button>
        )}
        {extraActions}
      </form>
      {/* Utanför formuläret, eftersom arket har ett eget formulär */}
      {picking && (
        <IngredientPicker
          onAdd={(food, grams) => {
            form.addIngredient(food, grams)
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  )
}
