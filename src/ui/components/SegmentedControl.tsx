import { useId } from 'react'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  /** Gruppens namn för skärmläsare. */
  label: string
  options: readonly Option<T>[]
  /** Tom sträng betyder att inget är valt ännu. */
  value: T | ''
  onChange: (value: T) => void
}

/** Radioknappar som ser ut som en knapprad. Varje grupp får ett eget name, så att flera grupper inte krockar. */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
  const name = useId()
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value}>
          <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
          {option.label}
        </label>
      ))}
    </div>
  )
}
