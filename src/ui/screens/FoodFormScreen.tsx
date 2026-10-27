import type { CustomFoodInput } from '../../data/foodsRepo'
import { FoodForm } from '../components/FoodForm'
import { Loading } from '../components/Loading'
import { useAction } from '../hooks/useAction'
import { useFood } from '../hooks/useFood'
import { useFoodActions } from '../hooks/useFoodActions'
import type { FoodFormInitial } from '../hooks/useFoodForm'
import { navigate, toHash, type AddContext, type FoodFormAction } from '../router'

type Props = AddContext & { action: FoodFormAction; ref?: string }

const TITLES: Record<FoodFormAction, string> = {
  new: 'Nytt livsmedel',
  copy: 'Rätta näringsvärden',
  edit: 'Ändra livsmedel',
}

export function FoodFormScreen({ date, meal, action, ref }: Props) {
  const source = useFood(action === 'new' ? undefined : ref)
  const foods = useFoodActions()

  const backTo = (foodId?: string) => navigate({ name: 'add', date, meal, foodId })

  const saving = useAction(async (input: CustomFoodInput) => {
    const food = action === 'edit' && ref ? await foods.update(ref, input) : await foods.create(input)
    backTo(food.id)
  }, 'Livsmedlet kunde inte sparas. Försök igen.')

  const deleting = useAction(async (id: string) => {
    await foods.remove(id)
    backTo()
  }, 'Livsmedlet kunde inte tas bort. Försök igen.')

  function handleDelete() {
    if (!ref || !window.confirm('Ta bort livsmedlet? Det du redan har loggat påverkas inte.')) return
    void deleting.run(ref)
  }

  if (source === undefined) return <Loading />
  const notFound = action !== 'new' && (source === null || (action === 'edit' && source.source !== 'custom'))
  const initial: FoodFormInitial = action === 'new' ? { barcode: ref } : (source ?? {})
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
