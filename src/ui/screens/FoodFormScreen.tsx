import type { CustomFoodInput } from '../../data/foodsRepo'
import { FoodForm } from '../components/FoodForm'
import { Loading } from '../components/Loading'
import { useAction } from '../hooks/useAction'
import { useFood } from '../hooks/useFood'
import { useFoodActions } from '../hooks/useFoodActions'
import type { FoodFormInitial } from '../hooks/useFoodForm'
import { navigate, toHash, type AddContext, type FoodFormAction, type FoodFormTarget } from '../router'

type Props = AddContext & FoodFormTarget

const TITLES: Record<FoodFormAction, string> = {
  new: 'Nytt livsmedel',
  copy: 'Rätta näringsvärden',
  edit: 'Ändra livsmedel',
}

export function FoodFormScreen(props: Props) {
  const { date, meal, action } = props
  // Livsmedlet som kopieras eller ändras. Ett nytt livsmedel utgår inte från något.
  const foodId = props.action === 'new' ? undefined : props.foodId
  const source = useFood(foodId)
  const foods = useFoodActions()

  const backTo = (id?: string) => navigate({ name: 'add', date, meal, foodId: id })

  const saving = useAction(async (input: CustomFoodInput) => {
    const food = action === 'edit' && foodId ? await foods.update(foodId, input) : await foods.create(input)
    backTo(food.id)
  }, 'Livsmedlet kunde inte sparas. Försök igen.')

  const deleting = useAction(async (id: string) => {
    await foods.remove(id)
    backTo()
  }, 'Livsmedlet kunde inte tas bort. Försök igen.')

  function handleDelete() {
    if (!foodId || !window.confirm('Ta bort livsmedlet? Det du redan har loggat påverkas inte.')) return
    void deleting.run(foodId)
  }

  if (source === undefined) return <Loading />
  const notFound = action !== 'new' && (source === null || (action === 'edit' && source.source !== 'custom'))
  const initial: FoodFormInitial = props.action === 'new' ? { barcode: props.barcode } : (source ?? {})
  const busy = saving.pending || deleting.pending

  return (
    <main className="screen stack">
      <header>
        <h1>{TITLES[action]}</h1>
        {action === 'copy' && source && (
          <p className="hint">Sparas som ett eget livsmedel. Originalet ändras inte.</p>
        )}
      </header>
      {notFound ? (
        <p className="error">Livsmedlet finns inte.</p>
      ) : (
        <FoodForm
          initial={initial}
          submitLabel={action === 'edit' ? 'Spara ändringar' : 'Spara livsmedel'}
          onSubmit={(input) => void saving.run(input)}
          busy={busy}
          error={saving.error ?? deleting.error}
          extraActions={
            action === 'edit' && (
              <button type="button" className="button-danger" onClick={handleDelete} disabled={busy}>
                Ta bort livsmedlet
              </button>
            )
          }
        />
      )}
      <a className="button-secondary" href={toHash({ name: 'add', date, meal })}>
        Avbryt
      </a>
    </main>
  )
}
