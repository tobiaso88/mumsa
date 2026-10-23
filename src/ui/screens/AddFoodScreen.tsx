import { useEffect, useState } from 'react'
import { addEntry } from '../../data/entriesRepo'
import { findFood } from '../../data/foodCatalog'
import type { Food, Meal } from '../../domain/types'
import { AmountForm } from '../components/AmountForm'
import { FoodList } from '../components/FoodList'
import { Sheet } from '../components/Sheet'
import { useDb } from '../dbContext'
import { formatDayTitle } from '../format'
import { useFoodSearch, useRecentFoods } from '../hooks/useFoodSearch'
import { entryName, MEAL_LABELS } from '../labels'
import { navigate, toHash, type AddContext } from '../router'

type Props = AddContext & { foodId?: string }

export function AddFoodScreen({ date, meal, foodId }: Props) {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const results = useFoodSearch(query)
  const recent = useRecentFoods()
  const searching = query.trim().length > 0

  // Öppna mängdpanelen direkt när vi kommer från skanning eller formuläret
  useEffect(() => {
    if (!foodId) return
    let cancelled = false
    findFood(db, foodId).then((food) => {
      if (!cancelled && food) setSelected(food)
    })
    return () => {
      cancelled = true
    }
  }, [db, foodId])

  async function handleAdd(food: Food, value: { grams: number; meal: Meal }) {
    await addEntry(db, { date, meal: value.meal, foodId: food.id, foodName: entryName(food), grams: value.grams, per100g: food.per100g })
    navigate({ name: 'day', date })
  }

  return (
    <main className="screen stack">
      <header>
        <h1>Lägg till i {MEAL_LABELS[meal].toLocaleLowerCase('sv')}</h1>
        <p className="hint">{formatDayTitle(date)}</p>
      </header>
      <input
        className="search-input"
        type="search"
        placeholder="Sök livsmedel, t.ex. havregryn"
        aria-label="Sök livsmedel"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="button-row">
        <a className="button-secondary" href={toHash({ name: 'scan', date, meal })}>
          Skanna streckkod
        </a>
        <a className="button-secondary" href={toHash({ name: 'food', action: 'new', date, meal })}>
          Eget livsmedel
        </a>
      </div>
      {searching ? (
        results &&
        (results.length > 0 ? (
          <FoodList label="Sökträffar" foods={results} onSelect={setSelected} />
        ) : (
          <p className="hint">Inga träffar på ”{query.trim()}”. Skanna produkten eller skapa ett eget livsmedel.</p>
        ))
      ) : (
        recent &&
        recent.length > 0 && (
          <section className="stack">
            <h2>Senast loggade</h2>
            <FoodList label="Senast loggade" foods={recent} onSelect={setSelected} />
          </section>
        )
      )}
      {selected && (
        <Sheet title={entryName(selected)} onClose={() => setSelected(null)}>
          <AmountForm
            food={selected}
            initialGrams={selected.servingGrams ?? 100}
            initialMeal={meal}
            submitLabel="Lägg till"
            onSubmit={(value) => handleAdd(selected, value)}
            extraActions={
              <a
                className="button-secondary"
                href={toHash({ name: 'food', action: selected.source === 'custom' ? 'edit' : 'copy', date, meal, ref: selected.id })}
              >
                {selected.source === 'custom' ? 'Ändra livsmedlet' : 'Rätta näringsvärden'}
              </a>
            }
          />
        </Sheet>
      )}
    </main>
  )
}
