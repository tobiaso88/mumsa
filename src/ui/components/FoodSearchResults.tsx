import type { Food } from '../../domain/types'
import { FoodList } from './FoodList'

type Props = {
  query: string
  /** Sökträffar för frågan, undefined medan sökningen pågår. */
  results: Food[] | undefined
  /** Favoriter, som visas först innan användaren har skrivit något. */
  favorites: Food[] | undefined
  /** Senast loggade livsmedel, som visas innan användaren har skrivit något. */
  recent: Food[] | undefined
  onSelect: (food: Food) => void
}

/** Sökträffar medan användaren söker, annars de senast loggade livsmedlen. */
export function FoodSearchResults({ query, results, favorites, recent, onSelect }: Props) {
  const trimmed = query.trim()

  if (trimmed === '') {
    // En favorit visas bara en gång, bland favoriterna
    const favoriteIds = new Set(favorites?.map((f) => f.id))
    const latest = recent?.filter((f) => !favoriteIds.has(f.id)) ?? []
    return (
      <>
        {favorites && favorites.length > 0 && (
          <section>
            <h2 className="section-title">Favoriter</h2>
            <FoodList label="Favoriter" foods={favorites} onSelect={onSelect} />
          </section>
        )}
        {latest.length > 0 && (
          <section>
            <h2 className="section-title">Senast loggade</h2>
            <FoodList label="Senast loggade" foods={latest} onSelect={onSelect} />
          </section>
        )}
      </>
    )
  }

  if (!results) return null
  if (results.length === 0) {
    return <p className="hint">Inga träffar på ”{trimmed}”. Skanna produkten eller skapa ett eget livsmedel.</p>
  }
  return (
    <section>
      <h2 className="section-title">Sökträffar</h2>
      <FoodList label="Sökträffar" foods={results} onSelect={onSelect} />
    </section>
  )
}
