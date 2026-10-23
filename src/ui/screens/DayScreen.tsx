import type { Goals, IsoDate } from '../../domain/types'
import { formatDayTitle, formatNumber } from '../format'

// Byggs ut med intag och måltider i fas 4
export function DayScreen({ date, goals }: { date: IsoDate; goals: Goals }) {
  return (
    <main className="screen stack">
      <h1>{formatDayTitle(date)}</h1>
      <p className="card">Mål: {formatNumber(goals.kcal)} kcal</p>
    </main>
  )
}
