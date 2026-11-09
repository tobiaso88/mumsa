import { useState } from 'react'
import type { Food, Meal } from '../../domain/types'
import { AmountForm } from '../components/AmountForm'
import { FoodList } from '../components/FoodList'
import { FoodSearchResults } from '../components/FoodSearchResults'
import { Icon } from '../components/Icon'
import { NavBar } from '../components/NavBar'
import { Sheet } from '../components/Sheet'
import { formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useEntryActions } from '../hooks/useEntryActions'
import { useFood } from '../hooks/useFood'
import { useFoodSearch, useRecentFoods } from '../hooks/useFoodSearch'
import { useRecipeFoods } from '../hooks/useRecipes'
import { entryName, MEAL_LABELS, SOURCE_LABELS } from '../labels'
import { navigate, toHash, type AddContext } from '../router'

type Props = AddContext & { foodId?: string }

const EDIT_LABELS: Record<Food['source'], string> = {
  custom: 'Ändra livsmedlet',
  recipe: 'Ändra receptet',
  off: 'Rätta näringsvärden',
  slv: 'Rätta näringsvärden',
}

/** Egna livsmedel och recept ändras direkt, övriga kopieras till ett eget livsmedel. */
function editHref(food: Food, date: AddContext['date'], meal: Meal): string {
  if (food.source === 'recipe') return toHash({ name: 'recipe', action: 'edit', context: { date, meal }, recipeId: food.id })
  return toHash({ name: 'food', action: food.source === 'custom' ? 'edit' : 'copy', date, meal, foodId: food.id })
}

/** Näring och källa under rubriken i mängdpanelen. Ett recept anges per portion. */
function sheetSubtitle(food: Food): string {
  if (food.source === 'recipe' && food.servingGrams) {
    return `${SOURCE_LABELS.recipe} · ${formatNumber((food.per100g.kcal * food.servingGrams) / 100)} kcal per portion`
  }
  return `${SOURCE_LABELS[food.source]} · ${formatNumber(food.per100g.kcal)} kcal per 100 g`
}

export function AddFoodScreen({ date, meal, foodId }: Props) {
  const [query, setQuery] = useState('')
  // undefined tills användaren själv har valt eller stängt något
  const [choice, setChoice] = useState<Food | null>()
  const preselected = useFood(foodId)
  const results = useFoodSearch(query)
  const recent = useRecentFoods()
  const recipes = useRecipeFoods()
  const entries = useEntryActions()

  // Öppna mängdpanelen direkt när vi kommer från skanning eller formuläret
  const selected = choice === undefined ? (preselected ?? null) : choice

  const adding = useAction(async (food: Food, value: { grams: number; meal: Meal }) => {
    await entries.add({ date, meal: value.meal, foodId: food.id, foodName: entryName(food), grams: value.grams, per100g: food.per100g })
    navigate({ name: 'day', date })
  }, 'Livsmedlet kunde inte loggas. Försök igen.')

  const editFood = selected && (
    <a className="round-button" href={editHref(selected, date, meal)} aria-label={EDIT_LABELS[selected.source]}>
      <Icon name="pencil" size={20} />
    </a>
  )

  return (
    <div className="presented-backdrop">
      <main className="screen presented stack">
        <div className="sheet-grabber" aria-hidden="true" />
        <NavBar
          title={`Lägg till i ${MEAL_LABELS[meal].toLocaleLowerCase('sv')}`}
          leading={
            <a className="nav-bar-button" href={toHash({ name: 'day', date })}>
              Avbryt
            </a>
          }
        />
        <label className="search-field">
          <Icon name="search" size={20} />
          <input
            type="search"
            placeholder="Sök livsmedel, t.ex. havregryn"
            aria-label="Sök livsmedel"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="button-row tiles">
          <a className="tile-button" href={toHash({ name: 'scan', date, meal })} aria-label="Skanna streckkod">
            <Icon name="scan" size={22} />
            Skanna
          </a>
          <a className="tile-button" href={toHash({ name: 'food', action: 'new', date, meal })}>
            <Icon name="pencil" size={22} />
            Eget livsmedel
          </a>
          <a className="tile-button" href={toHash({ name: 'recipe', action: 'new', context: { date, meal } })}>
            <Icon name="book" size={22} />
            Recept
          </a>
        </div>
        {query.trim() === '' && recipes && recipes.length > 0 && (
          <section>
            <h2 className="section-title">Mina recept</h2>
            <FoodList label="Mina recept" foods={recipes} onSelect={setChoice} />
          </section>
        )}
        <FoodSearchResults query={query} results={results} recent={recent} onSelect={setChoice} />
      </main>
      {selected && (
        <Sheet
          title={entryName(selected)}
          subtitle={sheetSubtitle(selected)}
          action={editFood}
          onClose={() => setChoice(null)}
        >
          <AmountForm
            food={selected}
            initialGrams={selected.servingGrams ?? 100}
            initialMeal={meal}
            preferPortions={selected.source === 'recipe'}
            submitLabel={(m) => `Lägg till i ${MEAL_LABELS[m].toLocaleLowerCase('sv')}`}
            onSubmit={(value) => void adding.run(selected, value)}
            busy={adding.pending}
            error={adding.error}
          />
        </Sheet>
      )}
    </div>
  )
}
