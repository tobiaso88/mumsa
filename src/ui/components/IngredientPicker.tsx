import { useState } from 'react'
import { isValidAmount } from '../../domain/nutrition/nutrition'
import type { Food } from '../../domain/types'
import { formatNumber, parseNumber, toInputText } from '../format'
import { useFoodSearch, useRecentFoods } from '../hooks/useFoodSearch'
import { entryName, SOURCE_LABELS } from '../labels'
import { FoodSearchResults } from './FoodSearchResults'
import { Icon } from './Icon'
import { NumberField } from './NumberField'
import { Sheet } from './Sheet'

type Props = {
  onAdd: (food: Food, grams: number) => void
  onClose: () => void
}

/** Ett recept är inte en ingrediens i ett annat recept. */
const isIngredient = (food: Food) => food.source !== 'recipe'

/** Sök ett livsmedel och ange mängd i gram. Används för att lägga till en ingrediens i ett recept. */
export function IngredientPicker({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [food, setFood] = useState<Food | null>(null)
  const [amount, setAmount] = useState('')
  const results = useFoodSearch(query)
  const recent = useRecentFoods()
  const grams = parseNumber(amount)

  function choose(chosen: Food) {
    setFood(chosen)
    setAmount(toInputText(chosen.servingGrams ?? 100))
  }

  if (food) {
    return (
      <Sheet title={entryName(food)} subtitle={`${SOURCE_LABELS[food.source]} · ${formatNumber(food.per100g.kcal)} kcal per 100 g`} onClose={onClose}>
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (isValidAmount(grams)) onAdd(food, grams)
          }}
        >
          <div className="card">
            <NumberField label="Mängd" unit="g" value={amount} onChange={setAmount} invalid={!isValidAmount(grams)} />
          </div>
          <button type="submit" className="button-primary" disabled={!isValidAmount(grams)}>
            Lägg till ingrediens
          </button>
          <button type="button" className="button-secondary" onClick={() => setFood(null)}>
            Välj ett annat livsmedel
          </button>
        </form>
      </Sheet>
    )
  }

  return (
    <Sheet title="Lägg till ingrediens" onClose={onClose}>
      <div className="stack">
        <label className="search-field">
          <Icon name="search" size={20} />
          <input
            type="search"
            placeholder="Sök livsmedel, t.ex. havregryn"
            aria-label="Sök ingrediens"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <FoodSearchResults query={query} results={results?.filter(isIngredient)} recent={recent?.filter(isIngredient)} onSelect={choose} />
      </div>
    </Sheet>
  )
}
