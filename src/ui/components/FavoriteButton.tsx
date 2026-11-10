import { useAction } from '../hooks/useAction'
import { useFavoriteActions, useFavoriteIds } from '../hooks/useFavorites'
import { Icon } from './Icon'

/** Stjärna som lägger till ett livsmedel bland favoriterna, eller tar bort det. */
export function FavoriteButton({ foodId }: { foodId: string }) {
  const ids = useFavoriteIds()
  const favorites = useFavoriteActions()
  const toggling = useAction(() => favorites.toggle(foodId), 'Favoriten kunde inte ändras. Försök igen.')
  const active = ids?.includes(foodId) ?? false

  return (
    <button
      type="button"
      className={active ? 'round-button favorite active' : 'round-button favorite'}
      aria-label={active ? 'Ta bort som favorit' : 'Markera som favorit'}
      aria-pressed={active}
      disabled={!ids || toggling.pending}
      onClick={() => void toggling.run()}
    >
      <Icon name="star" size={20} filled={active} />
    </button>
  )
}
