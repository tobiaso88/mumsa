import { useId } from 'react'

export type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  /** Enhet som visas efter fältet, till exempel g eller kcal. */
  unit?: string
  invalid?: boolean
  /** Styr vilket tangentbord mobilen visar. */
  inputMode?: 'text' | 'numeric' | 'decimal'
  maxLength?: number
}

export function TextField({ label, value, onChange, unit, invalid, inputMode, maxLength }: TextFieldProps) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-input">
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          maxLength={maxLength}
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="field-unit">{unit}</span>}
      </div>
    </div>
  )
}
