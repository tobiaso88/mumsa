import type { Food } from '../../domain/types'
import { formatNumber } from '../format'

const SOURCE_LABELS: Record<Food['source'], string> = {
  custom: 'Eget',
  slv: 'Livsmedelsverket',
  off: 'Skannad',
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
              {formatNumber(food.per100g.kcal)} kcal/100 g · {SOURCE_LABELS[food.source]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
