import type { Nutrients } from '../../domain/types'
import { formatNumber } from '../format'

function previewRows(n: Nutrients | null) {
  return [
    { label: 'kcal', value: n?.kcal, decimals: 0, color: 'var(--accent)' },
    { label: 'protein', value: n?.protein, decimals: 1, color: 'var(--protein)' },
    { label: 'kolh.', value: n?.carbs, decimals: 1, color: 'var(--carbs)' },
    { label: 'fett', value: n?.fat, decimals: 1, color: 'var(--fat)' },
  ]
}

/** Energi och makron i fyra kolumner. Visar streck för värden som saknas. */
export function NutrientPreview({ nutrients, label }: { nutrients: Nutrients | null; label: string }) {
  return (
    <dl className="nutrient-preview" aria-label={label}>
      {previewRows(nutrients).map((row) => (
        <div key={row.label}>
          <dt>
            <span className="dot" style={{ background: row.color }} />
            {row.label}
          </dt>
          <dd>{row.value === undefined ? '–' : formatNumber(row.value, row.decimals)}</dd>
        </div>
      ))}
    </dl>
  )
}
