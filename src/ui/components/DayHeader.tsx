import { addDays, toIsoDate } from '../../domain/dates'
import type { IsoDate } from '../../domain/types'
import { formatDayTitle } from '../format'
import { toHash } from '../router'

export function DayHeader({ date }: { date: IsoDate }) {
  const today = toIsoDate(new Date())
  const title = date === today ? 'Idag' : formatDayTitle(date)
  return (
    <header className="day-header">
      <a className="icon-button" href={toHash({ name: 'day', date: addDays(date, -1) })} aria-label="Föregående dag">
        ‹
      </a>
      <div className="day-title">
        <h1>{title}</h1>
        {date === today ? (
          <p className="hint">{formatDayTitle(date)}</p>
        ) : (
          <a className="hint" href={toHash({ name: 'day', date: today })}>
            Gå till idag
          </a>
        )}
      </div>
      <a className="icon-button" href={toHash({ name: 'day', date: addDays(date, 1) })} aria-label="Nästa dag">
        ›
      </a>
    </header>
  )
}
