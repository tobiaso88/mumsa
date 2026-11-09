import type { IsoDate, WeightEntry } from '../../domain/types'
import { weeklyChange, weightProgress } from '../../domain/weight/weight'
import { formatNumber, formatShortDate } from '../format'

type Props = {
  weights: readonly WeightEntry[]
  targetKg?: number
  today: IsoDate
}

/** T.ex. "−1,4 kg" eller "+0,3 kg". */
function formatKgChange(kg: number): string {
  const rounded = Math.round(kg * 10) / 10
  if (rounded === 0) return '±0 kg'
  return `${rounded > 0 ? '+' : '−'}${formatNumber(Math.abs(rounded), 1)} kg`
}

function TargetLine({ leftKg, reached, targetKg }: { leftKg: number; reached: boolean; targetKg: number }) {
  if (reached) return <p className="success">Du har nått din målvikt på {formatNumber(targetKg, 1)} kg.</p>
  return (
    <p>
      {formatNumber(Math.abs(leftKg), 1)} kg kvar till målvikten {formatNumber(targetKg, 1)} kg.
    </p>
  )
}

/** Senaste vikt, förändring och läget mot målvikten. */
export function WeightProgress({ weights, targetKg, today }: Props) {
  const progress = weightProgress(weights, targetKg)
  if (!progress) return <p className="hint">Logga din vikt för att följa hur den förändras över tid.</p>
  const perWeek = weeklyChange(weights, today)

  return (
    <section className="card day-summary" aria-label="Viktförändring">
      <div className="kcal-headline">
        <p className="kcal-big">{formatNumber(progress.latest.kg, 1)} kg</p>
        <p className="hint">senast vägd {formatShortDate(progress.latest.date)}</p>
      </div>
      {progress.start.date !== progress.latest.date && (
        <p>
          {formatKgChange(progress.changeKg)} sedan {formatShortDate(progress.start.date)}
          {perWeek !== null && <>, i snitt {formatKgChange(perWeek)} per vecka den senaste månaden</>}.
        </p>
      )}
      {targetKg !== undefined && progress.leftKg !== null && progress.reached !== null && (
        <TargetLine leftKg={progress.leftKg} reached={progress.reached} targetKg={targetKg} />
      )}
    </section>
  )
}
