import { useState } from 'react'
import type { Food, Meal } from '../../domain/types'
import { AmountForm } from '../components/AmountForm'
import { FoodSearchResults } from '../components/FoodSearchResults'
import { Icon } from '../components/Icon'
import { NavBar } from '../components/NavBar'
import { Sheet } from '../components/Sheet'
import { formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useEntryActions } from '../hooks/useEntryActions'
import { useFood } from '../hooks/useFood'
import { useFoodSearch, useRecentFoods } from '../hooks/useFoodSearch'
import { entryName, MEAL_LABELS, SOURCE_LABELS } from '../labels'
import { navigate, toHash, type AddContext } from '../router'

type Props = AddContext & { foodId?: string }

export function AddFoodScreen({ date, meal, foodId }: Props) {
  const [query, setQuery] = useState('')
  // undefined tills användaren själv har valt eller stängt något
  const [choice, setChoice] = useState<Food | null>()
  const preselected = useFood(foodId)
  const results = useFoodSearch(query)
  const recent = useRecentFoods()
  const entries = useEntryActions()

  // Öppna mängdpanelen direkt när vi kommer från skanning eller formuläret
  const selected = choice === undefined ? (preselected ?? null) : choice

  const adding = useAction(async (food: Food, value: { grams: number; meal: Meal }) => {
    await entries.add({ date, meal: value.meal, foodId: food.id, foodName: entryName(food), grams: value.grams, per100g: food.per100g })
    navigate({ name: 'day', date })
  }, 'Livsmedlet kunde inte loggas. Försök igen.')

  const editFood = selected && (
    <a
      className="round-button"
      href={toHash({ name: 'food', action: selected.source === 'custom' ? 'edit' : 'copy', date, meal, foodId: selected.id })}
      aria-label={selected.source === 'custom' ? 'Ändra livsmedlet' : 'Rätta näringsvärden'}
    >
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
        <div className="button-row">
          <a className="tile-button" href={toHash({ name: 'scan', date, meal })} aria-label="Skanna streckkod">
            <Icon name="scan" size={22} />
            Skanna
          </a>
          <a className="tile-button" href={toHash({ name: 'food', action: 'new', date, meal })}>
            <Icon name="pencil" size={22} />
            Eget livsmedel
          </a>
        </div>
        <FoodSearchResults query={query} results={results} recent={recent} onSelect={setChoice} />
      </main>
      {selected && (
        <Sheet
          title={entryName(selected)}
          subtitle={`${SOURCE_LABELS[selected.source]} · ${formatNumber(selected.per100g.kcal)} kcal per 100 g`}
          action={editFood}
          onClose={() => setChoice(null)}
        >
          <AmountForm
            food={selected}
            initialGrams={selected.servingGrams ?? 100}
            initialMeal={meal}
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
