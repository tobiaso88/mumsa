import { kcalLeft } from '../../domain/goals'
import type { Goals, Nutrients } from '../../domain/types'
import { formatNumber } from '../format'
import { MacroProgress } from './MacroProgress'

export function DaySummary({ total, goals }: { total: Nutrients; goals: Goals }) {
  const left = kcalLeft(goals, total)
  return (
    <section className="card day-summary" aria-label="Dagens intag">
      <div className="kcal-headline">
        <p className="kcal-big">{formatNumber(Math.abs(left))}</p>
        <p className="kcal-caption">{left >= 0 ? 'kcal kvar' : 'kcal över målet'}</p>
        <p className="hint">
          {formatNumber(total.kcal)} av {formatNumber(goals.kcal)} kcal
        </p>
      </div>
      <MacroProgress intake={total} goals={goals} />
    </section>
  )
}
