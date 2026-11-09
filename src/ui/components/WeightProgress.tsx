import type { IsoDate, WeightEntry } from '../../domain/types'
import { targetProgressRatio, weeklyChange, weightProgress } from '../../domain/weight/weight'
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

type TargetProps = { startKg: number; targetKg: number; leftKg: number; reached: boolean; ratio: number | null }

/** Stapel från startvikten till målvikten med en markör för var vikten ligger nu. */
function TargetBar({ startKg, targetKg, leftKg, reached, ratio }: TargetProps) {
  const pct = `${(reached ? 1 : (ratio ?? 0)) * 100}%`
  return (
    <div className="target-progress">
      <div className="target-track" aria-hidden="true">
        <div className="target-fill" style={{ width: pct }} />
        <span className="target-knob" style={{ left: pct }} />
      </div>
      <div className="target-labels">
        <span>Start {formatNumber(startKg, 1)}</span>
        {reached ? (
          <strong>Målet är nått</strong>
        ) : (
          <strong>{formatNumber(Math.abs(leftKg), 1)} kg kvar</strong>
        )}
        <span>Mål {formatNumber(targetKg, 1)}</span>
      </div>
      {reached && <p className="success">Du har nått din målvikt på {formatNumber(targetKg, 1)} kg.</p>}
    </div>
  )
}

/** Senaste vikt, förändring och läget mot målvikten. */
export function WeightProgress({ weights, targetKg, today }: Props) {
  const progress = weightProgress(weights, targetKg)
  if (!progress) return <p className="hint empty-hint">Logga din vikt för att följa hur den förändras över tid.</p>
  const perWeek = weeklyChange(weights, today)
  const latestLabel = progress.latest.date === today ? 'idag' : formatShortDate(progress.latest.date)
  const changed = progress.start.date !== progress.latest.date

  return (
    <section className="card stat-card" aria-label="Viktförändring">
      <div className="weight-hero">
        <div>
          <p className="hint">Senast · {latestLabel}</p>
          <p className="kcal-big">{formatNumber(progress.latest.kg, 1)} kg</p>
        </div>
        {changed && (
          <span className="pill">
            {formatKgChange(progress.changeKg)} sedan {formatShortDate(progress.start.date)}
          </span>
        )}
      </div>
      {targetKg !== undefined && progress.leftKg !== null && progress.reached !== null && (
        <TargetBar
          startKg={progress.start.kg}
          targetKg={targetKg}
          leftKg={progress.leftKg}
          reached={progress.reached}
          ratio={targetProgressRatio(progress, targetKg)}
        />
      )}
      {perWeek !== null && changed && (
        <p className="hint">Det är i snitt {formatKgChange(perWeek)} per vecka den senaste månaden.</p>
      )}
    </section>
  )
}
