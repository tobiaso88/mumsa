import { useState } from 'react'
import { summarizeDay } from '../../domain/summary'
import { MEALS, type Goals, type IsoDate, type LogEntry } from '../../domain/types'
import { DayHeader } from '../components/DayHeader'
import { DaySummary } from '../components/DaySummary'
import { EditEntrySheet } from '../components/EditEntrySheet'
import { Loading } from '../components/Loading'
import { MealSection } from '../components/MealSection'
import { useDayEntries } from '../hooks/useEntries'

export function DayScreen({ date, goals }: { date: IsoDate; goals: Goals }) {
  const entries = useDayEntries(date)
  const [editing, setEditing] = useState<LogEntry | null>(null)
  if (!entries) return <Loading />
  const summary = summarizeDay(entries)

  return (
    <main className="screen stack">
      <DayHeader date={date} />
      <DaySummary total={summary.total} goals={goals} />
      {MEALS.map((meal) => (
        <MealSection
          key={meal}
          date={date}
          meal={meal}
          entries={entries.filter((e) => e.meal === meal)}
          total={summary.byMeal[meal]}
          onSelect={setEditing}
        />
      ))}
      {editing && <EditEntrySheet entry={editing} onClose={() => setEditing(null)} />}
    </main>
  )
}
