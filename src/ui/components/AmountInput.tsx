import type { AmountUnit } from '../../domain/foods/measures'
import type { Food } from '../../domain/types'
import { formatNumber } from '../format'
import type { AmountState } from '../hooks/useAmount'
import { AmountStepper } from './AmountStepper'
import { SegmentedControl } from './SegmentedControl'

const UNIT_LABELS: Record<AmountUnit, string> = { g: 'Gram', dl: 'dl', msk: 'msk', tsk: 'tsk', st: 'st', portion: 'Portioner' }
/** Enheten efter talet i fältet. */
const UNIT_SUFFIX: Record<AmountUnit, string> = { g: 'g', dl: 'dl', msk: 'msk', tsk: 'tsk', st: 'st', portion: 'portioner' }

type Props = {
  amount: AmountState
  /** Beskrivning av en portion, t.ex. "1 skiva". */
  servingLabel?: string
  /** Livsmedlets källa. Hushållsmåtten från Livsmedelsverket anges med källa. */
  source?: Food['source']
}

/** Enhetsval, mängdfält och en rad som visar vad mängden motsvarar i gram. */
export function AmountInput({ amount, servingLabel, source }: Props) {
  const { units, unit, perUnit, grams } = amount
  const measureSource = source === 'slv' ? 'Livsmedelsverket' : undefined
  const options = units.map((value) => ({ value, label: UNIT_LABELS[value] }))
  const isMeasure = unit !== 'g' && unit !== 'portion'

  return (
    <>
      {options.length > 1 && <SegmentedControl label="Enhet" options={options} value={unit} onChange={amount.setUnit} />}
      <AmountStepper value={amount.amount} onChange={amount.setAmount} onStep={amount.step} unit={UNIT_SUFFIX[unit]} invalid={grams === null} />
      {unit !== 'g' && (
        <p className="hint stepper-hint">
          {unit === 'portion' && servingLabel && <span>En portion är {servingLabel}. </span>}
          {isMeasure && (
            <span>
              1 {unit} väger ungefär {formatNumber(perUnit, 1)} g{measureSource && ` enligt ${measureSource}`}.{' '}
            </span>
          )}
          {grams !== null && <span>Motsvarar {formatNumber(grams)} g.</span>}
        </p>
      )}
    </>
  )
}
