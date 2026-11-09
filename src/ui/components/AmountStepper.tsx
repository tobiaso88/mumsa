import { useId } from 'react'
import { Icon } from './Icon'

type Props = {
  value: string
  onChange: (value: string) => void
  onStep: (direction: 1 | -1) => void
  /** Kort enhet efter talet, t.ex. g eller portioner. */
  unit: string
  invalid: boolean
}

/** Mängdfält med stora minus- och plusknappar på var sin sida. */
export function AmountStepper({ value, onChange, onStep, unit, invalid }: Props) {
  const id = useId()
  return (
    <div className="stepper">
      <button type="button" className="stepper-button" aria-label="Minska" onClick={() => onStep(-1)}>
        <Icon name="minus" size={22} strokeWidth={2.4} />
      </button>
      <div className="stepper-field">
        <label htmlFor={id} className="visually-hidden">
          Mängd
        </label>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="stepper-unit">{unit}</span>
      </div>
      <button type="button" className="stepper-button" aria-label="Öka" onClick={() => onStep(1)}>
        <Icon name="plus" size={22} strokeWidth={2.4} />
      </button>
    </div>
  )
}
