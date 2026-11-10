import { useState } from 'react'
import { summarizeDay } from '../../domain/nutrition/summary'
import { MEALS, type Goals, type IsoDate, type LogEntry, type Meal } from '../../domain/types'
import { CopyMealSheet } from '../components/CopyMealSheet'
import { DayHeader } from '../components/DayHeader'
import { DaySummary } from '../components/DaySummary'
import { EditEntrySheet } from '../components/EditEntrySheet'
import { Loading } from '../components/Loading'
import { MealSection } from '../components/MealSection'
import { useDayEntries } from '../hooks/useEntries'

export function DayScreen({ date, goals }: { date: IsoDate; goals: Goals }) {
  const entries = useDayEntries(date)
  const [editing, setEditing] = useState<LogEntry | null>(null)
  const [copyingTo, setCopyingTo] = useState<Meal | null>(null)
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
          onCopy={setCopyingTo}
        />
      ))}
      {editing && <EditEntrySheet entry={editing} onClose={() => setEditing(null)} />}
      {copyingTo && <CopyMealSheet date={date} meal={copyingTo} onClose={() => setCopyingTo(null)} />}
    </main>
  )
}
