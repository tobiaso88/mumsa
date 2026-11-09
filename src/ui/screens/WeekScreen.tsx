import { addDays, isoWeekNumber, startOfWeek } from '../../domain/dates'
import { summarizeWeek } from '../../domain/nutrition/summary'
import type { Goals, IsoDate } from '../../domain/types'
import { Loading } from '../components/Loading'
import { MacroProgress } from '../components/MacroProgress'
import { PeriodHeader } from '../components/PeriodHeader'
import { WeekChart } from '../components/WeekChart'
import { formatDayTitle, formatNumber, formatShortDate } from '../format'
import { useWeekEntries } from '../hooks/useEntries'
import { toHash } from '../router'
import { useToday } from '../todayContext'

export function WeekScreen({ date, goals }: { date: IsoDate; goals: Goals }) {
  const weekStart = startOfWeek(date)
  const weekEnd = addDays(weekStart, 6)
  const entries = useWeekEntries(weekStart)
  const today = useToday()
  if (!entries) return <Loading />
  const week = summarizeWeek(entries, weekStart)

  return (
    <main className="screen stack">
      <PeriodHeader
        title={`Vecka ${isoWeekNumber(weekStart)}`}
        subtitle={
          <p>
            {formatShortDate(weekStart)} – {formatShortDate(weekEnd)}
          </p>
        }
        previous={{ href: toHash({ name: 'week', date: addDays(weekStart, -7) }), label: 'Föregående vecka' }}
        next={{ href: toHash({ name: 'week', date: addDays(weekStart, 7) }), label: 'Nästa vecka' }}
      />

      <section className="card stat-card" aria-label="Energi per dag">
        <div className="chart-headline">
          <p>
            Snitt <strong>{week.loggedDays > 0 ? formatNumber(week.average.kcal) : '–'}</strong> kcal
          </p>
          <p className="hint">Mål {formatNumber(goals.kcal)}</p>
        </div>
        <WeekChart days={week.days} goalKcal={goals.kcal} today={today} />
      </section>

      <section className="card stat-card" aria-label="Snitt per dag">
        <div className="card-title-row">
          <h2>Snitt per loggad dag</h2>
          {week.loggedDays > 0 && <span className="hint">{week.loggedDays} av 7 dagar</span>}
        </div>
        {week.loggedDays === 0 ? (
          <p className="hint">Inget loggat den här veckan.</p>
        ) : (
          <MacroProgress intake={week.average} goals={goals} energy={false} />
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
