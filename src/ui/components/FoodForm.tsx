import type { FormEvent, ReactNode } from 'react'
import type { CustomFoodInput } from '../../data/repos/foodsRepo'
import { MAX_KCAL_PER_100G, MAX_TEXT_LENGTH, type NutrientIssue } from '../../domain/foods/foodValidation'
import { formatNumber } from '../format'
import { useFoodForm, type FoodFormInitial } from '../hooks/useFoodForm'
import { NavBar } from './NavBar'
import { NumberField } from './NumberField'
import { TextField } from './TextField'

// Makrotexten säger 100 g eftersom det stämmer fysiskt. Marginalen i domain/ är bara för avrundning.
const ISSUE_TEXT: Record<NutrientIssue, string> = {
  negative: 'Fyll i energi, protein, kolhydrater och fett. Skriv 0 om det inte finns något.',
  macrosOver100: 'Protein, kolhydrater och fett kan inte bli mer än 100 g per 100 g.',
  kcalTooHigh: `Energin kan inte vara högre än ${formatNumber(MAX_KCAL_PER_100G)} kcal per 100 g.`,
}

type Props = {
  title: string
  /** Vart Avbryt leder. */
  cancelHref: string
  /** Rad under navigeringen, t.ex. att en kopia sparas som eget livsmedel. */
  note?: string
  initial: FoodFormInitial
  submitLabel: string
  onSubmit: (input: CustomFoodInput) => void
  extraActions?: ReactNode
  /** Sant medan formuläret sparas. Stänger av knappen så att inget sparas två gånger. */
  busy?: boolean
  error?: string | null
}

export function FoodForm({ title, cancelHref, note, initial, submitLabel, onSubmit, extraActions, busy, error }: Props) {
  const { fields, set, issues, servingValid, barcodeValid, kcalWarning, input } = useFoodForm(initial)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (input) onSubmit(input)
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <NavBar
        title={title}
        leading={
          <a className="nav-bar-button" href={cancelHref}>
            Avbryt
          </a>
        }
        trailing={
          <button type="submit" className="nav-bar-button strong" aria-label={submitLabel} disabled={!input || busy}>
            Spara
          </button>
        }
      />
      {note && <p className="hint group-footer">{note}</p>}
      <div className="card">
        <TextField label="Namn" value={fields.name} onChange={(v) => set('name', v)} maxLength={MAX_TEXT_LENGTH} />
        <TextField label="Varumärke" placeholder="Valfritt" value={fields.brand} onChange={(v) => set('brand', v)} maxLength={MAX_TEXT_LENGTH} />
        <TextField label="Streckkod" placeholder="Valfritt" value={fields.barcode} onChange={(v) => set('barcode', v)} inputMode="numeric" />
        {!barcodeValid && <p className="error">Streckkoden ska vara 6–14 siffror.</p>}
      </div>
      <fieldset className="group">
        <legend className="section-title">Portion</legend>
        <div className="card">
          <NumberField label="Portionsstorlek" unit="g" value={fields.servingGrams} onChange={(v) => set('servingGrams', v)} invalid={!servingValid} />
          <TextField label="Beskrivning" value={fields.servingLabel} onChange={(v) => set('servingLabel', v)} maxLength={MAX_TEXT_LENGTH} />
        </div>
        <p className="hint group-footer">Valfritt. Till exempel 30 g och ”1 skiva”.</p>
      </fieldset>
      <fieldset className="group">
        <legend className="section-title">Näring per 100 g</legend>
        <div className="card">
          <NumberField label="Energi" unit="kcal" value={fields.kcal} onChange={(v) => set('kcal', v)} />
          <NumberField label="Protein" unit="g" value={fields.protein} onChange={(v) => set('protein', v)} />
          <NumberField label="Kolhydrater" unit="g" value={fields.carbs} onChange={(v) => set('carbs', v)} />
          <NumberField label="Fett" unit="g" value={fields.fat} onChange={(v) => set('fat', v)} />
        </div>
        {issues.map((issue) => (
          <p key={issue} className="error group-footer">
            {ISSUE_TEXT[issue]}
          </p>
        ))}
        {kcalWarning && (
          <p className="hint group-footer" role="status">
            Energin stämmer dåligt med protein, kolhydrater och fett. Kontrollera gärna värdena.
          </p>
        )}
        <p className="hint group-footer">Sparas bara på den här enheten.</p>
      </fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {extraActions}
    </form>
  )
}
