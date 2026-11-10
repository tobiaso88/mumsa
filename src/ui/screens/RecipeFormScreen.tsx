import type { RecipeInput } from '../../data/repos/recipesRepo'
import { Loading } from '../components/Loading'
import { NavBar } from '../components/NavBar'
import { RecipeForm } from '../components/RecipeForm'
import { useAction } from '../hooks/useAction'
import { useRecipeActions } from '../hooks/useRecipeActions'
import { useRecipe } from '../hooks/useRecipes'
import { addContextNow, navigate, toHash, type AddContext, type RecipeFormTarget } from '../router'

type Props = { context?: AddContext } & RecipeFormTarget

export function RecipeFormScreen(props: Props) {
  const { context, action } = props
  const recipeId = props.action === 'edit' ? props.recipeId : undefined
  const recipe = useRecipe(recipeId)
  const recipes = useRecipeActions()

  // Tillbaka till lägg till-flödet om formuläret öppnades därifrån, annars till receptlistan
  const backTo = (id?: string) => navigate(context ? { name: 'add', ...context, foodId: id } : { name: 'recipes' })

  const save = (input: RecipeInput) => (recipeId ? recipes.update(recipeId, input) : recipes.create(input))

  const saving = useAction(async (input: RecipeInput) => {
    backTo((await save(input)).id)
  }, 'Receptet kunde inte sparas. Försök igen.')

  // Från receptlistan: spara eventuella ändringar och öppna mängdpanelen för dagens måltid
  const logging = useAction(async (input: RecipeInput) => {
    const saved = await save(input)
    navigate({ name: 'add', ...addContextNow(new Date()), foodId: saved.id })
  }, 'Receptet kunde inte sparas. Försök igen.')

  const deleting = useAction(async (id: string) => {
    await recipes.remove(id)
    backTo()
  }, 'Receptet kunde inte tas bort. Försök igen.')

  function handleDelete() {
    if (!recipeId || !window.confirm('Ta bort receptet? Det du redan har loggat påverkas inte.')) return
    void deleting.run(recipeId)
  }

  if (recipe === undefined) return <Loading />
  const cancelHref = toHash(context ? { name: 'add', ...context } : { name: 'recipes' })
  const title = action === 'edit' ? 'Ändra recept' : 'Nytt recept'

  if (action === 'edit' && recipe === null) {
    return (
      <main className="screen modal-screen stack">
        <NavBar
          title={title}
          leading={
            <a className="nav-bar-button" href={cancelHref}>
              Avbryt
            </a>
          }
        />
        <p className="error">Receptet finns inte.</p>
      </main>
    )
  }

  const busy = saving.pending || logging.pending || deleting.pending
  return (
    <main className="screen modal-screen stack">
      <RecipeForm
        title={title}
        cancelHref={cancelHref}
        initial={recipe ?? undefined}
        submitLabel={action === 'edit' ? 'Spara ändringar' : 'Spara recept'}
        onSubmit={(input) => void saving.run(input)}
        busy={busy}
        error={saving.error ?? logging.error ?? deleting.error}
        secondarySubmit={
          action === 'edit' && !context ? { label: 'Logga i dagboken', onSubmit: (input) => void logging.run(input) } : undefined
        }
        extraActions={
          action === 'edit' && (
            <button type="button" className="button-danger" onClick={handleDelete} disabled={busy}>
              Ta bort receptet
            </button>
          )
        }
      />
    </main>
  )
}
