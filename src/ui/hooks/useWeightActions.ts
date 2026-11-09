import { deleteWeight, logWeight } from '../../data/weightsRepo'
import type { IsoDate } from '../../domain/types'
import { useDb } from '../dbContext'

/** Skrivningar för vägningar, bundna till appens databas. */
export function useWeightActions() {
  const db = useDb()
  return {
    log: async (date: IsoDate, kg: number) => {
      await logWeight(db, date, kg)
    },
    remove: (date: IsoDate) => deleteWeight(db, date),
  }
}
