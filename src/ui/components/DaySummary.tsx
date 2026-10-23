import { macroGrams } from '../../domain/goals'
import type { Goals, Nutrients } from '../../domain/types'
import { formatNumber } from '../format'
import { ProgressBar } from './ProgressBar'

export function DaySummary({ total, goals }: { total: Nutrients; goals: Goals }) {
  const macros = macroGrams(goals.kcal, goals.split)
  const left = goals.kcal - total.kcal
  return (
    <section className="card day-summary" aria-label="Dagens intag">
      <div className="kcal-headline">
        <p className="kcal-big">{formatNumber(Math.abs(left))}</p>
        <p className="kcal-caption">{left >= 0 ? 'kcal kvar' : 'kcal över målet'}</p>
        <p className="hint">
          {formatNumber(total.kcal)} av {formatNumber(goals.kcal)} kcal
        </p>
      </div>
      <ProgressBar label="Energi" value={total.kcal} goal={goals.kcal} unit="kcal" color="var(--accent)" />
      <ProgressBar label="Protein" value={total.protein} goal={macros.protein} unit="g" color="var(--protein)" />
      <ProgressBar label="Kolhydrater" value={total.carbs} goal={macros.carbs} unit="g" color="var(--carbs)" />
      <ProgressBar label="Fett" value={total.fat} goal={macros.fat} unit="g" color="var(--fat)" />
    </section>
  )
}
