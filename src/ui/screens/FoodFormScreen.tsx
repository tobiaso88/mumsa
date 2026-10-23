import { useEffect, useState } from 'react'
import { findFood } from '../../data/foodCatalog'
import { createCustomFood, deleteCustomFood, updateCustomFood, type CustomFoodInput } from '../../data/foodsRepo'
import type { Food } from '../../domain/types'
import { FoodForm } from '../components/FoodForm'
import { useDb } from '../dbContext'
import type { FoodFormInitial } from '../hooks/useFoodForm'
import { navigate, toHash, type AddContext, type FoodFormAction } from '../router'

type Props = AddContext & { action: FoodFormAction; ref?: string }

const TITLES: Record<FoodFormAction, string> = {
  new: 'Nytt livsmedel',
  copy: 'Rätta näringsvärden',
  edit: 'Ändra livsmedel',
}

export function FoodFormScreen({ date, meal, action, ref }: Props) {
  const db = useDb()
  const [source, setSource] = useState<Food | null | undefined>(action === 'new' ? null : undefined)

  useEffect(() => {
    if (action === 'new' || !ref) return
    let cancelled = false
    findFood(db, ref).then((food) => {
      if (!cancelled) setSource(food ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [db, action, ref])

  const backTo = (foodId?: string) => navigate({ name: 'add', date, meal, foodId })

  async function handleSubmit(input: CustomFoodInput) {
    const food = action === 'edit' && ref ? await updateCustomFood(db, ref, input) : await createCustomFood(db, input)
    backTo(food.id)
  }

  async function handleDelete() {
    if (!ref || !window.confirm('Ta bort livsmedlet? Det du redan har loggat påverkas inte.')) return
    await deleteCustomFood(db, ref)
    backTo()
  }

  if (source === undefined) return null
  const notFound = action !== 'new' && (source === null || (action === 'edit' && source.source !== 'custom'))
  const initial: FoodFormInitial = action === 'new' ? { barcode: ref } : (source ?? {})

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
          onSubmit={handleSubmit}
          extraActions={
            action === 'edit' && (
              <button type="button" className="button-danger" onClick={handleDelete}>
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
