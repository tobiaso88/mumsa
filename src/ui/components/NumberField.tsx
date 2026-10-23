import { useId } from 'react'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  unit?: string
  invalid?: boolean
}

export function NumberField({ label, value, onChange, unit, invalid }: Props) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-input">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </div>
    </div>
  )
}
