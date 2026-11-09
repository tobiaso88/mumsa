import type { Food } from '../../domain/types'
import { formatNumber } from '../format'
import { SOURCE_LABELS } from '../labels'

/** Ett recept anges per portion, övriga livsmedel per 100 g. */
function nutritionLabel(food: Food): string {
  if (food.source === 'recipe' && food.servingGrams) {
    return `${formatNumber((food.per100g.kcal * food.servingGrams) / 100)} kcal/portion`
  }
  return `${formatNumber(food.per100g.kcal)} kcal/100 g`
}

export function FoodList({ foods, onSelect, label }: { foods: Food[]; onSelect: (food: Food) => void; label: string }) {
  return (
    <ul className="food-list" aria-label={label}>
      {foods.map((food) => (
        <li key={food.id}>
          <button type="button" className="entry" onClick={() => onSelect(food)}>
            <span className="entry-name">
              {food.name}
              {food.brand && <span className="entry-brand">, {food.brand}</span>}
            </span>
            <span className="entry-meta">
              {SOURCE_LABELS[food.source]} · {nutritionLabel(food)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
