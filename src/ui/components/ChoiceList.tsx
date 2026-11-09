import { useId } from 'react'
import { Icon } from './Icon'

type Option<T extends string> = { value: T; label: string; hint?: string }

type Props<T extends string> = {
  label: string
  options: readonly Option<T>[]
  value: T | ''
  onChange: (value: T) => void
}

/** Val i en lista med bock vid det valda, som i inställningarna på en mobil. Bygger på radioknappar. */
export function ChoiceList<T extends string>({ label, options, value, onChange }: Props<T>) {
  const name = useId()
  return (
    <fieldset className="choice-list">
      <legend className="visually-hidden">{label}</legend>
      <ul className="list-card">
        {options.map((option) => (
          <li key={option.value}>
            <label className="list-row choice-row">
              <input
                className="visually-hidden"
                type="radio"
                name={name}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
              />
              <span className="list-row-body">
                <span className="list-label">
                  {option.label}
                  {option.hint && <span className="choice-hint">{option.hint}</span>}
                </span>
                {value === option.value && (
                  <span className="choice-check">
                    <Icon name="check" size={20} strokeWidth={2.6} />
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
