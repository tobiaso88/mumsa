import { getWeights } from '../../data/weightsRepo'
import type { WeightEntry } from '../../domain/types'
import { useDb } from '../dbContext'
import { useLiveQuery } from './useLiveQuery'

/** Alla vägningar, äldst först. undefined medan de laddar. */
export function useWeights(): WeightEntry[] | undefined {
  const db = useDb()
  return useLiveQuery(() => getWeights(db), [db])
}
