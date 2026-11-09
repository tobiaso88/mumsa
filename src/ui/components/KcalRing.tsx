import type { ReactNode } from 'react'

const SIZE = 140
const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type Props = {
  value: number
  goal: number
  /** Text i mitten av ringen. */
  children: ReactNode
}

/** Ring som fylls medan dagens energi närmar sig målet. Siffrorna finns som text bredvid. */
export function KcalRing({ value, goal, children }: Props) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0
  return (
    <div className="kcal-ring">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
        <circle className="kcal-ring-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} />
        {ratio > 0 && (
          <circle
            className="kcal-ring-fill"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        )}
      </svg>
      <div className="kcal-ring-label">{children}</div>
    </div>
  )
}
