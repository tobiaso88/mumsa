import { daysBetween } from '../../domain/dates'
import type { IsoDate, WeightEntry } from '../../domain/types'
import { formatNumber, formatShortDate } from '../format'

type Props = {
  /** Vägningar inom perioden, äldst först. */
  weights: readonly WeightEntry[]
  from: IsoDate
  to: IsoDate
  targetKg?: number
}

const WIDTH = 340
const HEIGHT = 180
const TOP = 16
const BOTTOM = 24
const LEFT = 4
const RIGHT = 36

/** Linjediagram över vikten under perioden, med målvikt som streckad linje. Siffrorna finns även i listan. */
export function WeightChart({ weights, from, to, targetKg }: Props) {
  const values = weights.map((w) => w.kg)
  if (targetKg !== undefined) values.push(targetKg)
  const min = Math.floor(Math.min(...values) - 0.5)
  const max = Math.ceil(Math.max(...values) + 0.5)
  const span = Math.max(1, daysBetween(from, to))
  const plotW = WIDTH - LEFT - RIGHT
  const plotH = HEIGHT - TOP - BOTTOM
  const x = (date: IsoDate) => LEFT + (daysBetween(from, date) / span) * plotW
  const y = (kg: number) => TOP + plotH - ((kg - min) / (max - min)) * plotH
  const points = weights.map((w) => `${x(w.date)},${y(w.kg)}`).join(' ')
  const label = weights.map((w) => `${formatShortDate(w.date)} ${formatNumber(w.kg, 1)} kg`).join(', ')
  const target = targetKg !== undefined ? ` Målvikt ${formatNumber(targetKg, 1)} kg.` : ''

  return (
    <svg className="week-chart weight-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Vikt: ${label}.${target}`}>
      <text x={WIDTH} y={TOP + 4} textAnchor="end" className="axis">
        {formatNumber(max)} kg
      </text>
      <text x={WIDTH} y={TOP + plotH} textAnchor="end" className="axis">
        {formatNumber(min)} kg
      </text>
      {targetKg !== undefined && (
        <>
          <line x1={LEFT} x2={LEFT + plotW} y1={y(targetKg)} y2={y(targetKg)} className="goal-line" />
          <text x={LEFT + plotW} y={y(targetKg) - 4} textAnchor="end" className="axis">
            mål {formatNumber(targetKg, 1)}
          </text>
        </>
      )}
      <polyline points={points} className="line" />
      {weights.map((w) => (
        <circle key={w.date} cx={x(w.date)} cy={y(w.kg)} r={3} className="dot" />
      ))}
      <line x1={LEFT} x2={LEFT + plotW} y1={TOP + plotH} y2={TOP + plotH} className="baseline" />
      <text x={LEFT} y={HEIGHT - 6} className="axis">
        {formatShortDate(from)}
      </text>
      <text x={LEFT + plotW} y={HEIGHT - 6} textAnchor="end" className="axis">
        {formatShortDate(to)}
      </text>
    </svg>
  )
}
