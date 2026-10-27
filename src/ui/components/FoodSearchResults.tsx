import type { Food } from '../../domain/types'
import { FoodList } from './FoodList'

type Props = {
  query: string
  /** Sökträffar för frågan, undefined medan sökningen pågår. */
  results: Food[] | undefined
  /** Senast loggade livsmedel, som visas innan användaren har skrivit något. */
  recent: Food[] | undefined
  onSelect: (food: Food) => void
}

/** Sökträffar medan användaren söker, annars de senast loggade livsmedlen. */
export function FoodSearchResults({ query, results, recent, onSelect }: Props) {
  const trimmed = query.trim()

  if (trimmed === '') {
    if (!recent || recent.length === 0) return null
    return (
      <section className="stack">
        <h2>Senast loggade</h2>
        <FoodList label="Senast loggade" foods={recent} onSelect={onSelect} />
      </section>
    )
  }

  if (!results) return null
  if (results.length === 0) {
    return <p className="hint">Inga träffar på ”{trimmed}”. Skanna produkten eller skapa ett eget livsmedel.</p>
  }
  return <FoodList label="Sökträffar" foods={results} onSelect={onSelect} />
}
