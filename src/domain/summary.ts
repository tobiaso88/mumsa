import { weekDates } from './dates'
import { entryNutrients, scaleNutrients, sumNutrients, ZERO_NUTRIENTS } from './nutrition'
import { MEALS, type IsoDate, type LogEntry, type Meal, type Nutrients } from './types'

export type DaySummary = {
  total: Nutrients
  byMeal: Record<Meal, Nutrients>
}

export type WeekSummary = {
  days: { date: IsoDate; total: Nutrients }[]
  /** Snitt över de dagar som har minst en loggad post. */
  average: Nutrients
  loggedDays: number
}

export function summarizeDay(entries: readonly LogEntry[]): DaySummary {
  const byMeal = Object.fromEntries(
    MEALS.map((meal) => [
      meal,
      sumNutrients(entries.filter((e) => e.meal === meal).map(entryNutrients)),
    ]),
  ) as Record<Meal, Nutrients>
  return { total: sumNutrients(Object.values(byMeal)), byMeal }
}

export function summarizeWeek(entries: readonly LogEntry[], weekStart: IsoDate): WeekSummary {
  const days = weekDates(weekStart).map((date) => {
    const dayEntries = entries.filter((e) => e.date === date)
    return { date, total: summarizeDay(dayEntries).total, logged: dayEntries.length > 0 }
  })
  const logged = days.filter((d) => d.logged)
  const average =
    logged.length === 0
      ? { ...ZERO_NUTRIENTS }
      : scaleNutrients(sumNutrients(logged.map((d) => d.total)), 1 / logged.length)
  return {
    days: days.map(({ date, total }) => ({ date, total })),
    average,
    loggedDays: logged.length,
  }
}
