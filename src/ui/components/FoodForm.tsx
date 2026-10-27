import { useId, type FormEvent, type ReactNode } from 'react'
import type { CustomFoodInput } from '../../data/foodsRepo'
import { MAX_KCAL_PER_100G, type NutrientIssue } from '../../domain/foodValidation'
import { formatNumber } from '../format'
import { useFoodForm, type FoodFormInitial } from '../hooks/useFoodForm'
import { NumberField } from './NumberField'

// Makrotexten säger 100 g eftersom det stämmer fysiskt. Marginalen i domain/ är bara för avrundning.
const ISSUE_TEXT: Record<NutrientIssue, string> = {
  negative: 'Fyll i energi, protein, kolhydrater och fett. Skriv 0 om det inte finns något.',
  macrosOver100: 'Protein, kolhydrater och fett kan inte bli mer än 100 g per 100 g.',
  kcalTooHigh: `Energin kan inte vara högre än ${formatNumber(MAX_KCAL_PER_100G)} kcal per 100 g.`,
}

function TextField({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (v: string) => void; inputMode?: 'numeric' }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field-input">
        <input id={id} type="text" inputMode={inputMode} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  )
}

type Props = {
  initial: FoodFormInitial
  submitLabel: string
  onSubmit: (input: CustomFoodInput) => void
  extraActions?: ReactNode
  /** Sant medan formuläret sparas. Stänger av knappen så att inget sparas två gånger. */
  busy?: boolean
  error?: string | null
}

export function FoodForm({ initial, submitLabel, onSubmit, extraActions, busy, error }: Props) {
  const { fields, set, issues, servingValid, barcodeValid, kcalWarning, input } = useFoodForm(initial)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (input) onSubmit(input)
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="card">
        <TextField label="Namn" value={fields.name} onChange={(v) => set('name', v)} />
        <TextField label="Varumärke (valfritt)" value={fields.brand} onChange={(v) => set('brand', v)} />
        <TextField label="Streckkod (valfritt)" value={fields.barcode} onChange={(v) => set('barcode', v)} inputMode="numeric" />
        {!barcodeValid && <p className="error">Streckkoden ska vara 6–14 siffror.</p>}
      </div>
      <fieldset className="card">
        <legend>Näring per 100 g</legend>
        <div className="field-row">
          <NumberField label="Energi" unit="kcal" value={fields.kcal} onChange={(v) => set('kcal', v)} />
          <NumberField label="Protein" unit="g" value={fields.protein} onChange={(v) => set('protein', v)} />
        </div>
        <div className="field-row">
          <NumberField label="Kolhydrater" unit="g" value={fields.carbs} onChange={(v) => set('carbs', v)} />
          <NumberField label="Fett" unit="g" value={fields.fat} onChange={(v) => set('fat', v)} />
        </div>
        {issues.map((issue) => (
          <p key={issue} className="error">
            {ISSUE_TEXT[issue]}
          </p>
        ))}
        {kcalWarning && (
          <p className="hint" role="status">
            Energin stämmer dåligt med protein, kolhydrater och fett. Kontrollera gärna värdena.
          </p>
        )}
      </fieldset>
      <fieldset className="card">
        <legend>Portion (valfritt)</legend>
        <div className="field-row">
          <NumberField label="Portionsstorlek" unit="g" value={fields.servingGrams} onChange={(v) => set('servingGrams', v)} invalid={!servingValid} />
          <TextField label="Beskrivning" value={fields.servingLabel} onChange={(v) => set('servingLabel', v)} />
        </div>
        <p className="hint">Till exempel 30 g och ”1 skiva”.</p>
      </fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="button-primary" disabled={!input || busy}>
        {submitLabel}
      </button>
      {extraActions}
    </form>
  )
}
