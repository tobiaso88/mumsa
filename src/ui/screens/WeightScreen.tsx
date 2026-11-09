import { useState } from 'react'
import { addDays } from '../../domain/dates'
import type { Goals } from '../../domain/types'
import { weightsInRange } from '../../domain/weight/weight'
import { Icon } from '../components/Icon'
import { Loading } from '../components/Loading'
import { SegmentedControl } from '../components/SegmentedControl'
import { Sheet } from '../components/Sheet'
import { WeightChart } from '../components/WeightChart'
import { WeightForm } from '../components/WeightForm'
import { WeightList } from '../components/WeightList'
import { WeightProgress } from '../components/WeightProgress'
import { useWeights } from '../hooks/useWeights'
import { useToday } from '../todayContext'

type Period = '1' | '3' | '6'
const PERIOD_OPTIONS: readonly { value: Period; label: string }[] = [
  { value: '1', label: '1 mån' },
  { value: '3', label: '3 mån' },
  { value: '6', label: '6 mån' },
]

export function WeightScreen({ goals }: { goals: Goals }) {
  const weights = useWeights()
  const today = useToday()
  const [period, setPeriod] = useState<Period>('3')
  const [logging, setLogging] = useState(false)
  if (!weights) return <Loading />
  const from = addDays(today, -Number(period) * 30)
  const inRange = weightsInRange(weights, from, today)

  return (
    <main className="screen stack">
      <header className="large-title">
        <h1>Vikt</h1>
        <button type="button" className="round-button filled" aria-label="Logga vikt" onClick={() => setLogging(true)}>
          <Icon name="plus" size={22} strokeWidth={2.4} />
        </button>
      </header>
      <WeightProgress weights={weights} targetKg={goals.targetWeightKg} today={today} />
      {weights.length > 0 && (
        <section className="card stack" aria-label="Viktkurva">
          <SegmentedControl label="Period" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
          {inRange.length > 0 ? (
            <WeightChart weights={inRange} from={from} to={today} targetKg={goals.targetWeightKg} />
          ) : (
            <p className="hint">Inga vägningar under perioden.</p>
          )}
        </section>
      )}
      <WeightList weights={weights} />
      {logging && (
        <Sheet title="Logga vikt" onClose={() => setLogging(false)}>
          <WeightForm weights={weights} onSaved={() => setLogging(false)} />
        </Sheet>
      )}
    </main>
  )
}
