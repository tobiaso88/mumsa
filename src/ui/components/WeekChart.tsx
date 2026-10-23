import type { IsoDate, Nutrients } from '../../domain/types'
import { formatNumber, formatWeekdayShort } from '../format'

type Props = {
  days: { date: IsoDate; total: Nutrients }[]
  goalKcal: number
  today: IsoDate
}

const WIDTH = 340
const HEIGHT = 180
const TOP = 16
const BOTTOM = 24
const SLOT = WIDTH / 7
const BAR = 26

/** Stapeldiagram över kcal per dag med mållinje. Siffrorna finns även som text under diagrammet. */
export function WeekChart({ days, goalKcal, today }: Props) {
  const max = Math.max(goalKcal * 1.25, ...days.map((d) => d.total.kcal))
  const plot = HEIGHT - TOP - BOTTOM
  const y = (kcal: number) => TOP + plot - (kcal / max) * plot
  const goalY = y(goalKcal)
  const label = days.map((d) => `${formatWeekdayShort(d.date)} ${formatNumber(d.total.kcal)} kcal`).join(', ')

  return (
    <svg className="week-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Energi per dag: ${label}. Mål ${formatNumber(goalKcal)} kcal.`}>
      {days.map((d, i) => {
        const x = i * SLOT + (SLOT - BAR) / 2
        const top = y(d.total.kcal)
        const over = d.total.kcal > goalKcal
        return (
          <g key={d.date}>
            {d.total.kcal > 0 && (
              <rect x={x} y={top} width={BAR} height={TOP + plot - top} rx={4} className={over ? 'bar bar-over' : 'bar'} />
            )}
            <text x={x + BAR / 2} y={HEIGHT - 6} textAnchor="middle" className={d.date === today ? 'axis axis-today' : 'axis'}>
              {formatWeekdayShort(d.date)}
            </text>
          </g>
        )
      })}
      <line x1={0} x2={WIDTH} y1={goalY} y2={goalY} className="goal-line" />
      <text x={WIDTH} y={goalY - 4} textAnchor="end" className="axis">
        mål {formatNumber(goalKcal)}
      </text>
      <line x1={0} x2={WIDTH} y1={TOP + plot} y2={TOP + plot} className="baseline" />
    </svg>
  )
}
