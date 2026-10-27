import { useEffect, useState } from 'react'
import { getRecentFoodIds } from '../../data/entriesRepo'
import { findFoods, searchAllFoods } from '../../data/foodCatalog'
import type { Food } from '../../domain/types'
import { useDb } from '../dbContext'
import { useAsync } from './useAsync'
import { useLiveQuery } from './useLiveQuery'

const DEBOUNCE_MS = 150

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return debounced
}

/** Sökträffar för en fråga, med kort fördröjning medan användaren skriver. */
export function useFoodSearch(query: string): Food[] | undefined {
  const db = useDb()
  const debounced = useDebouncedValue(query, DEBOUNCE_MS)
  const foods = useAsync(() => searchAllFoods(db, debounced), [db, debounced])
  return debounced === query ? foods : undefined
}

/**
 * Senast loggade livsmedel. Id:n bevakas i databasen, uppslaget görs utanför
 * bevakningen eftersom det även läser den buntade filen från Livsmedelsverket.
 */
export function useRecentFoods(): Food[] | undefined {
  const db = useDb()
  const ids = useLiveQuery(() => getRecentFoodIds(db), [db])
  const foods = useAsync(async () => (ids ? findFoods(db, ids) : undefined), [db, ids])
  return ids ? foods : undefined
}
