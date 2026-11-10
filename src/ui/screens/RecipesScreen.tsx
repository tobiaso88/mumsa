import { recipeNutrientsPerServing } from '../../domain/recipes/recipes'
import type { Recipe } from '../../domain/types'
import { Icon } from '../components/Icon'
import { ListGroup, type ListRow } from '../components/ListGroup'
import { Loading } from '../components/Loading'
import { formatNumber } from '../format'
import { useRecipeList } from '../hooks/useRecipes'
import { toHash } from '../router'

function recipeRow(recipe: Recipe): ListRow {
  const perServing = recipeNutrientsPerServing(recipe)
  const servings = `${formatNumber(recipe.servings, 2)} ${recipe.servings === 1 ? 'portion' : 'portioner'}`
  return {
    label: recipe.name,
    detail: perServing ? `${formatNumber(perServing.kcal)} kcal · ${servings}` : servings,
    href: toHash({ name: 'recipe', action: 'edit', recipeId: recipe.id }),
  }
}

/** Alla egna recept. Ett recept öppnas för att ändras eller tas bort, utan att något loggas. */
export function RecipesScreen() {
  const recipes = useRecipeList()
  if (!recipes) return <Loading />

  return (
    <main className="screen stack">
      <header>
        <a className="back-link" href={toHash({ name: 'profile' })}>
          <Icon name="chevronLeft" size={26} strokeWidth={2.4} />
          Profil
        </a>
        <div className="large-title">
          <h1>Recept</h1>
          <a className="round-button filled" href={toHash({ name: 'recipe', action: 'new' })} aria-label="Nytt recept">
            <Icon name="plus" size={22} strokeWidth={2.4} />
          </a>
        </div>
      </header>
      {recipes.length === 0 ? (
        <p className="hint">Du har inga recept än. Tryck på plus för att skapa ett.</p>
      ) : (
        <ListGroup
          label="Mina recept"
          rows={recipes.map(recipeRow)}
          footer="Näring per portion. Logga ett recept från Lägg till i dagboken."
        />
      )}
    </main>
  )
}
