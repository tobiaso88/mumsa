import { useState } from 'react'
import type { Food } from '../../domain/types'
import { formatNumber } from '../format'
import { useAmount } from '../hooks/useAmount'
import { useFavoriteFoods } from '../hooks/useFavorites'
import { useFoodSearch, useRecentFoods } from '../hooks/useFoodSearch'
import { entryName, SOURCE_LABELS } from '../labels'
import { AmountInput } from './AmountInput'
import { FoodSearchResults } from './FoodSearchResults'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

type Props = {
  onAdd: (food: Food, grams: number) => void
  onClose: () => void
}

/** Ett recept är inte en ingrediens i ett annat recept. */
const isIngredient = (food: Food) => food.source !== 'recipe'

/** Mängd för en vald ingrediens, i gram eller hushållsmått. */
function IngredientAmount({ food, onAdd, onBack, onClose }: { food: Food; onAdd: Props['onAdd']; onBack: () => void; onClose: () => void }) {
  const amount = useAmount(food, food.servingGrams ?? 100)
  const { grams } = amount

  return (
    <Sheet title={entryName(food)} subtitle={`${SOURCE_LABELS[food.source]} · ${formatNumber(food.per100g.kcal)} kcal per 100 g`} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          if (grams !== null) onAdd(food, grams)
        }}
      >
        <AmountInput amount={amount} servingLabel={food.servingLabel} source={food.source} />
        <button type="submit" className="button-primary" disabled={grams === null}>
          Lägg till ingrediens
        </button>
        <button type="button" className="button-secondary" onClick={onBack}>
          Välj ett annat livsmedel
        </button>
      </form>
    </Sheet>
  )
}

/** Sök ett livsmedel och ange mängd i gram eller hushållsmått. Används för att lägga till en ingrediens i ett recept. */
export function IngredientPicker({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [food, setFood] = useState<Food | null>(null)
  const results = useFoodSearch(query)
  const recent = useRecentFoods()
  const favorites = useFavoriteFoods()

  if (food) return <IngredientAmount key={food.id} food={food} onAdd={onAdd} onBack={() => setFood(null)} onClose={onClose} />

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
        <FoodSearchResults
          query={query}
          results={results?.filter(isIngredient)}
          favorites={favorites?.filter(isIngredient)}
          recent={recent?.filter(isIngredient)}
          onSelect={setFood}
        />
      </div>
    </Sheet>
  )
}
