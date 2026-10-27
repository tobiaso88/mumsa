import { addDays, isoWeekNumber, startOfWeek, toIsoDate } from '../../domain/dates'
import { macroGrams } from '../../domain/goals'
import { summarizeWeek } from '../../domain/summary'
import type { Goals, IsoDate } from '../../domain/types'
import { Loading } from '../components/Loading'
import { ProgressBar } from '../components/ProgressBar'
import { WeekChart } from '../components/WeekChart'
import { formatDayTitle, formatNumber, formatShortDate } from '../format'
import { useWeekEntries } from '../hooks/useEntries'
import { toHash } from '../router'

export function WeekScreen({ date, goals }: { date: IsoDate; goals: Goals }) {
  const weekStart = startOfWeek(date)
  const weekEnd = addDays(weekStart, 6)
  const entries = useWeekEntries(weekStart)
  const today = toIsoDate(new Date())
  if (!entries) return <Loading />
  const week = summarizeWeek(entries, weekStart)
  const macros = macroGrams(goals.kcal, goals.split)

  return (
    <main className="screen stack">
      <header className="day-header">
        <a className="icon-button" href={toHash({ name: 'week', date: addDays(weekStart, -7) })} aria-label="Föregående vecka">
          ‹
        </a>
        <div className="day-title">
          <h1>Vecka {isoWeekNumber(weekStart)}</h1>
          <p className="hint">
            {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
          </p>
        </div>
        <a className="icon-button" href={toHash({ name: 'week', date: addDays(weekStart, 7) })} aria-label="Nästa vecka">
          ›
        </a>
      </header>

      <section className="card" aria-label="Energi per dag">
        <WeekChart days={week.days} goalKcal={goals.kcal} today={today} />
      </section>

      <section className="card day-summary" aria-label="Snitt per dag">
        <h2>Snitt per loggad dag</h2>
        {week.loggedDays === 0 ? (
          <p className="hint">Inget loggat den här veckan.</p>
        ) : (
          <>
            <p className="hint">Räknat på {week.loggedDays} av 7 dagar.</p>
            <ProgressBar label="Energi" value={week.average.kcal} goal={goals.kcal} unit="kcal" color="var(--accent)" />
            <ProgressBar label="Protein" value={week.average.protein} goal={macros.protein} unit="g" color="var(--protein)" />
            <ProgressBar label="Kolhydrater" value={week.average.carbs} goal={macros.carbs} unit="g" color="var(--carbs)" />
            <ProgressBar label="Fett" value={week.average.fat} goal={macros.fat} unit="g" color="var(--fat)" />
          </>
        )}
      </section>

      <ul className="food-list" aria-label="Dagar">
        {week.days.map((d) => (
          <li key={d.date}>
            <a className="entry week-day" href={toHash({ name: 'day', date: d.date })}>
              <span className="entry-name">{formatDayTitle(d.date)}</span>
              <span className="entry-meta">{d.total.kcal > 0 ? `${formatNumber(d.total.kcal)} kcal` : 'Inget loggat'}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
