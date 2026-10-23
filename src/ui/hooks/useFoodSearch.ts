import { useEffect, useState } from 'react'
import { getRecentFoodIds } from '../../data/entriesRepo'
import { findFoods, searchAllFoods } from '../../data/foodCatalog'
import type { Food } from '../../domain/types'
import { useDb } from '../dbContext'
import { useLiveQuery } from './useLiveQuery'

const DEBOUNCE_MS = 150

/** Sökträffar för en fråga, med kort fördröjning medan användaren skriver. */
export function useFoodSearch(query: string): Food[] | undefined {
  const db = useDb()
  const [result, setResult] = useState<{ query: string; foods: Food[] } | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      const foods = await searchAllFoods(db, query)
      if (!cancelled) setResult({ query, foods })
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [db, query])

  return result?.query === query ? result.foods : undefined
}

/**
 * Senast loggade livsmedel. Id:n bevakas i databasen, uppslaget görs utanför
 * liveQuery eftersom det även läser den buntade filen från Livsmedelsverket.
 */
export function useRecentFoods(): Food[] | undefined {
  const db = useDb()
  const ids = useLiveQuery(() => getRecentFoodIds(db), [db])
  const [result, setResult] = useState<{ ids: string[]; foods: Food[] } | null>(null)

  useEffect(() => {
    if (!ids) return
    let cancelled = false
    findFoods(db, ids).then((foods) => {
      if (!cancelled) setResult({ ids, foods })
    })
    return () => {
      cancelled = true
    }
  }, [db, ids])

  return ids && result?.ids === ids ? result.foods : undefined
}
