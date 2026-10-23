import { formatNumber } from '../format'

type Props = {
  label: string
  value: number
  goal: number
  unit: string
  color: string
}

/** Stapel för intag mot mål. Stapeln fylls som mest till 100 % men texten visar verkligt värde. */
export function ProgressBar({ label, value, goal, unit, color }: Props) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0
  return (
    <div className="progress">
      <div className="progress-text">
        <span>{label}</span>
        <span>
          {formatNumber(value)} / {formatNumber(goal)} {unit}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.round(goal)}
        aria-valuenow={Math.round(value)}
      >
        <div className="progress-fill" style={{ width: `${ratio * 100}%`, background: color }} />
      </div>
    </div>
  )
}
