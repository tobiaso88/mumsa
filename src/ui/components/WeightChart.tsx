import { daysBetween, monthStarts } from '../../domain/dates'
import type { IsoDate, WeightEntry } from '../../domain/types'
import { formatMonthShort, formatNumber, formatShortDate } from '../format'

type Props = {
  /** Vägningar inom perioden, äldst först. */
  weights: readonly WeightEntry[]
  from: IsoDate
  to: IsoDate
  targetKg?: number
}

const WIDTH = 340
const HEIGHT = 170
const TOP = 10
const BOTTOM = 22
const LEFT = 26
const RIGHT = 8

/** Hela kilon med jämna steg som täcker min till max, högst fyra linjer. */
function gridLines(min: number, max: number): number[] {
  const step = Math.max(1, Math.ceil((max - min) / 3))
  const lines: number[] = []
  for (let kg = Math.ceil(min / step) * step; kg <= max; kg += step) lines.push(kg)
  return lines
}

/** Linjediagram över vikten under perioden. Målvikten ritas bara om den ryms i skalan. Siffrorna finns även i listan. */
export function WeightChart({ weights, from, to, targetKg }: Props) {
  const values = weights.map((w) => w.kg)
  const min = Math.floor(Math.min(...values) - 0.5)
  const max = Math.ceil(Math.max(...values) + 0.5)
  const span = Math.max(1, daysBetween(from, to))
  const plotW = WIDTH - LEFT - RIGHT
  const plotH = HEIGHT - TOP - BOTTOM
  const x = (date: IsoDate) => LEFT + (daysBetween(from, date) / span) * plotW
  const y = (kg: number) => TOP + plotH - ((kg - min) / (max - min)) * plotH
  const points = weights.map((w) => `${x(w.date)},${y(w.kg)}`).join(' ')
  const last = weights[weights.length - 1]
  const label = weights.map((w) => `${formatShortDate(w.date)} ${formatNumber(w.kg, 1)} kg`).join(', ')
  const target = targetKg !== undefined ? ` Målvikt ${formatNumber(targetKg, 1)} kg.` : ''
  const showTarget = targetKg !== undefined && targetKg >= min && targetKg <= max

  return (
    <svg className="week-chart weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Vikt: ${label}.${target}`}>
      {gridLines(min, max).map((kg) => (
        <g key={kg}>
          <line x1={LEFT} x2={WIDTH} y1={y(kg)} y2={y(kg)} className="grid-line" />
          <text x={0} y={y(kg) + 4} className="axis">
            {formatNumber(kg)}
          </text>
        </g>
      ))}
      {showTarget && <line x1={LEFT} x2={WIDTH} y1={y(targetKg)} y2={y(targetKg)} className="goal-line" />}
      {monthStarts(from, to).map((date) => (
        <text key={date} x={x(date)} y={HEIGHT - 4} className="axis" textAnchor="middle">
          {formatMonthShort(date)}
        </text>
      ))}
      <polyline points={points} className="line" />
      {last && <circle cx={x(last.date)} cy={y(last.kg)} r={5.5} className="dot" />}
    </svg>
  )
}
