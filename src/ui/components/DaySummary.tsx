import { kcalLeft } from '../../domain/goals/goals'
import type { Goals, Nutrients } from '../../domain/types'
import { formatNumber } from '../format'
import { KcalRing } from './KcalRing'
import { MacroProgress } from './MacroProgress'

export function DaySummary({ total, goals }: { total: Nutrients; goals: Goals }) {
  const left = kcalLeft(goals, total)
  return (
    <section className="card day-summary" aria-label="Dagens intag">
      <KcalRing value={total.kcal} goal={goals.kcal}>
        <span className="kcal-big">{formatNumber(Math.abs(left))}</span>
        <span className="kcal-caption">{left >= 0 ? 'kcal kvar' : 'kcal över målet'}</span>
      </KcalRing>
      <div className="day-summary-macros">
        <p className="day-summary-total">
          {formatNumber(total.kcal)} av {formatNumber(goals.kcal)} kcal
        </p>
        <MacroProgress intake={total} goals={goals} energy={false} />
      </div>
    </section>
  )
}
