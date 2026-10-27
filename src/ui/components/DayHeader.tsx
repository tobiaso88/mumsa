import { addDays, toIsoDate } from '../../domain/dates'
import type { IsoDate } from '../../domain/types'
import { formatDayTitle } from '../format'
import { toHash } from '../router'
import { PeriodHeader } from './PeriodHeader'

export function DayHeader({ date }: { date: IsoDate }) {
  const today = toIsoDate(new Date())
  const isToday = date === today
  return (
    <PeriodHeader
      title={isToday ? 'Idag' : formatDayTitle(date)}
      subtitle={
        isToday ? (
          <p className="hint">{formatDayTitle(date)}</p>
        ) : (
          <a className="hint" href={toHash({ name: 'day', date: today })}>
            Gå till idag
          </a>
        )
      }
      previous={{ href: toHash({ name: 'day', date: addDays(date, -1) }), label: 'Föregående dag' }}
      next={{ href: toHash({ name: 'day', date: addDays(date, 1) }), label: 'Nästa dag' }}
    />
  )
}
