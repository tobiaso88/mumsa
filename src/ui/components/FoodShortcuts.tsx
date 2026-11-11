import type { Food } from '../../domain/types'
import { FoodList } from './FoodList'
import { Icon } from './Icon'
import { SegmentedControl } from './SegmentedControl'

export type ShortcutTab = 'recent' | 'favorites' | 'recipes'

const TABS = [
  { value: 'recent', label: 'Senaste' },
  { value: 'favorites', label: 'Favoriter' },
  { value: 'recipes', label: 'Recept' },
] as const

/** Listans namn för skärmläsare. */
const LIST_LABELS: Record<ShortcutTab, string> = {
  recent: 'Senast loggade',
  favorites: 'Favoriter',
  recipes: 'Mina recept',
}

const EMPTY_HINTS: Record<ShortcutTab, string> = {
  recent: 'Här visas det du har loggat senast.',
  favorites: 'Inga favoriter än. Tryck på stjärnan när du lägger till ett livsmedel så hamnar det här.',
  recipes: 'Du har inga recept än.',
}

type Props = {
  tab: ShortcutTab
  onTabChange: (tab: ShortcutTab) => void
  /** Listorna är undefined medan de laddar. */
  recent: Food[] | undefined
  favorites: Food[] | undefined
  recipes: Food[] | undefined
  newRecipeHref: string
  onSelect: (food: Food) => void
}

/** Senast loggade, favoriter och recept som flikar, så att bara en lista visas åt gången. */
export function FoodShortcuts({ tab, onTabChange, recent, favorites, recipes, newRecipeHref, onSelect }: Props) {
  const lists: Record<ShortcutTab, Food[] | undefined> = { recent, favorites, recipes }
  const foods = lists[tab]

  return (
    <section className="stack">
      <SegmentedControl label="Visa" options={TABS} value={tab} onChange={onTabChange} />
      {tab === 'recipes' && (
        <a className="new-row" href={newRecipeHref}>
          <Icon name="plus" size={20} strokeWidth={2.4} />
          Nytt recept
        </a>
      )}
      {foods &&
        (foods.length > 0 ? (
          <FoodList label={LIST_LABELS[tab]} foods={foods} onSelect={onSelect} />
        ) : (
          <p className="hint">{EMPTY_HINTS[tab]}</p>
        ))}
    </section>
  )
}
