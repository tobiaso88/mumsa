import { useState } from 'react'
import { addEntry } from '../../data/entriesRepo'
import type { Food, IsoDate, Meal } from '../../domain/types'
import { AmountForm } from '../components/AmountForm'
import { FoodList } from '../components/FoodList'
import { Sheet } from '../components/Sheet'
import { useDb } from '../dbContext'
import { formatDayTitle } from '../format'
import { useFoodSearch, useRecentFoods } from '../hooks/useFoodSearch'
import { entryName, MEAL_LABELS } from '../labels'
import { navigate } from '../router'

export function AddFoodScreen({ date, meal }: { date: IsoDate; meal: Meal }) {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Food | null>(null)
  const results = useFoodSearch(query)
  const recent = useRecentFoods()
  const searching = query.trim().length > 0

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
        autoFocus
      />
      {searching ? (
        results &&
        (results.length > 0 ? (
          <FoodList label="Sökträffar" foods={results} onSelect={setSelected} />
        ) : (
          <p className="hint">Inga träffar på ”{query.trim()}”.</p>
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
          />
        </Sheet>
      )}
    </main>
  )
}
