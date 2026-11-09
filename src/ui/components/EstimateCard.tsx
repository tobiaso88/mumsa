import { formatNumber } from '../format'
import type { Estimate } from '../hooks/useGoalsForm'

type Props = {
  estimate: Estimate | null
  kcal: number
}

function signed(kcal: number): string {
  return `${kcal > 0 ? '+' : '−'}${formatNumber(Math.abs(kcal))}`
}

/** Uppskattat behov och hur målet justerar det. Allt presenteras som en uppskattning, inte ett råd. */
export function EstimateCard({ estimate, kcal }: Props) {
  if (estimate === null) {
    return (
      <div className="card">
        <p className="hint">Fyll i alla fält för att se en uppskattning. Formeln gäller vuxna från 18 år.</p>
      </div>
    )
  }
  const adjusted = estimate.adjustment !== 0
  return (
    <div className="card">
      <p className={adjusted ? undefined : 'estimate'}>
        Uppskattat behov: <strong>{formatNumber(estimate.maintenance)} kcal</strong> per dag
      </p>
      {adjusted && (
        <>
          <p className="estimate">
            Med ditt mål: <strong>{formatNumber(kcal)} kcal</strong> per dag
          </p>
          <p className="hint">
            {signed(estimate.adjustment)} kcal per dag, vilket enligt en tumregel om ungefär 7 700 kcal per kilo motsvarar
            ungefär {formatNumber(Math.abs(estimate.weeklyChangeKg), 2)} kg per vecka. Hur kroppen faktiskt svarar
            varierar.
          </p>
          {kcal < estimate.bmr && (
            <p className="hint">
              Målet ligger under din uppskattade basalomsättning på {formatNumber(estimate.bmr)} kcal, alltså vad kroppen
              förbrukar i vila.
            </p>
          )}
        </>
      )}
      <p className="hint">
        Uppskattningen bygger på en standardformel (Mifflin–St Jeor) och är ingen rekommendation eller medicinsk
        bedömning. Justera gärna målet efter hur det fungerar för dig.
      </p>
    </div>
  )
}
