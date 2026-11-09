import type { ImportMode } from '../../data/backup/backup'
import { formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import type { useImport } from '../hooks/useImport'
import { Sheet } from './Sheet'
import { SegmentedControl } from './SegmentedControl'

const MODE_OPTIONS: readonly { value: ImportMode; label: string }[] = [
  { value: 'merge', label: 'Slå ihop' },
  { value: 'replace', label: 'Ersätt allt' },
]

/** Livsmedelsverkets livsmedel i en importfil läses aldrig in, eftersom appen redan har dem. */
function SkippedFoods({ count, done = false }: { count: number; done?: boolean }) {
  if (count === 0) return null
  return (
    <p className="hint">
      {formatNumber(count)} livsmedel från Livsmedelsverket {done ? 'hoppades' : 'hoppas'} över eftersom de redan ingår i
      appen.
    </p>
  )
}

/** T.ex. "2 livsmedel, 5 loggposter och 3 vägningar". Vägningar nämns bara om det finns några. */
function contentSummary(foods: number, entries: number, weights: number): string {
  const parts = [`${formatNumber(foods)} livsmedel`, `${formatNumber(entries)} loggposter`]
  if (weights > 0) parts.push(`${formatNumber(weights)} vägningar`)
  return `${parts.slice(0, -1).join(', ')} och ${parts[parts.length - 1]}`
}

type Props = { importer: ReturnType<typeof useImport>; onClose: () => void }

/** Granska en vald fil och läs in den. Visas som ett ark när en fil är vald. */
export function ImportSheet({ importer, onClose }: Props) {
  const { state, mode, setMode, runImport } = importer
  // Importen sker i en transaktion, så ett fel lämnar databasen orörd
  const importing = useAction(runImport, 'Filen kunde inte läsas in. Ingen data har ändrats.')

  function handleImport() {
    const question = 'All nuvarande data i appen ersätts med innehållet i filen. Vill du fortsätta?'
    if (mode === 'replace' && !window.confirm(question)) return
    void importing.run()
  }

  return (
    <Sheet title="Importera säkerhetskopia" onClose={onClose}>
      <div className="stack">
        {state.kind === 'invalid' && <p className="error" role="alert">{state.error}</p>}
        {state.kind === 'ready' && (
          <>
            <p>
              Filen innehåller {contentSummary(state.data.foods.length, state.data.entries.length, state.data.weights.length)}.
            </p>
            <SkippedFoods count={state.skippedFoods} />
            <SegmentedControl label="Hur ska filen läsas in?" options={MODE_OPTIONS} value={mode} onChange={setMode} />
            <button type="button" className="button-primary" onClick={handleImport} disabled={importing.pending}>
              Importera
            </button>
            {importing.error && <p className="error" role="alert">{importing.error}</p>}
          </>
        )}
        {state.kind === 'done' && (
          <>
            <p className="success" role="status">
              Klart! {contentSummary(state.foods, state.entries, state.weights)} lästes in.
            </p>
            <SkippedFoods count={state.skippedFoods} done />
          </>
        )}
      </div>
    </Sheet>
  )
}
