import { useId, useState } from 'react'
import type { ImportMode } from '../../data/backup'
import { formatNumber } from '../format'
import { useAction } from '../hooks/useAction'
import { useExport } from '../hooks/useExport'
import { useImport } from '../hooks/useImport'
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

export function BackupSection() {
  const { state, mode, setMode, chooseFile, runImport } = useImport()
  const exportData = useExport()
  const [exported, setExported] = useState(false)
  const fileId = useId()

  const exporting = useAction(async () => {
    await exportData()
    setExported(true)
  }, 'Datan kunde inte exporteras. Försök igen.')
  // Importen sker i en transaktion, så ett fel lämnar databasen orörd
  const importing = useAction(runImport, 'Filen kunde inte läsas in. Ingen data har ändrats.')

  function handleImport() {
    const question = 'All nuvarande data i appen ersätts med innehållet i filen. Vill du fortsätta?'
    if (mode === 'replace' && !window.confirm(question)) return
    void importing.run()
  }

  return (
    <section className="card stack" aria-labelledby="backup-title">
      <h2 id="backup-title">Säkerhetskopia</h2>
      <p className="hint">Spara all data som en JSON-fil, till exempel för att flytta den till en annan enhet.</p>
      <button type="button" className="button-secondary" onClick={() => void exporting.run()} disabled={exporting.pending}>
        Exportera data
      </button>
      {exported && <p className="success" role="status">Filen är sparad.</p>}
      {exporting.error && <p className="error" role="alert">{exporting.error}</p>}

      <div className="field">
        <label htmlFor={fileId}>Importera från fil</label>
        <input id={fileId} type="file" accept=".json,application/json" onChange={(e) => void chooseFile(e.target.files?.[0])} />
      </div>
      {state.kind === 'invalid' && <p className="error" role="alert">{state.error}</p>}
      {state.kind === 'ready' && (
        <>
          <p>
            Filen innehåller {formatNumber(state.data.foods.length)} livsmedel och {formatNumber(state.data.entries.length)} loggposter.
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
            Klart! {formatNumber(state.foods)} livsmedel och {formatNumber(state.entries)} loggposter lästes in.
          </p>
          <SkippedFoods count={state.skippedFoods} done />
        </>
      )}
    </section>
  )
}
