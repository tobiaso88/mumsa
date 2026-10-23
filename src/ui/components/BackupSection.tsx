import { useState } from 'react'
import { exportAll } from '../../data/backup'
import { downloadExport } from '../../data/backupFile'
import { useDb } from '../dbContext'
import { formatNumber } from '../format'
import { useImport } from '../hooks/useImport'

export function BackupSection() {
  const db = useDb()
  const { state, mode, setMode, chooseFile, runImport } = useImport()
  const [exported, setExported] = useState(false)

  async function handleExport() {
    downloadExport(await exportAll(db))
    setExported(true)
  }

  function handleImport() {
    const question = 'All nuvarande data i appen ersätts med innehållet i filen. Vill du fortsätta?'
    if (mode === 'replace' && !window.confirm(question)) return
    void runImport()
  }

  return (
    <section className="card stack" aria-labelledby="backup-title">
      <h2 id="backup-title">Säkerhetskopia</h2>
      <p className="hint">Spara all data som en JSON-fil, till exempel för att flytta den till en annan enhet.</p>
      <button type="button" className="button-secondary" onClick={handleExport}>
        Exportera data
      </button>
      {exported && <p className="success" role="status">Filen är sparad.</p>}

      <div className="field">
        <label htmlFor="import-file">Importera från fil</label>
        <input id="import-file" type="file" accept=".json,application/json" onChange={(e) => void chooseFile(e.target.files?.[0])} />
      </div>
      {state.kind === 'invalid' && <p className="error" role="alert">{state.error}</p>}
      {state.kind === 'ready' && (
        <>
          <p>
            Filen innehåller {formatNumber(state.data.foods.length)} livsmedel och {formatNumber(state.data.entries.length)} loggposter.
          </p>
          <div className="segmented" role="radiogroup" aria-label="Hur ska filen läsas in?">
            <label>
              <input type="radio" name="import-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
              Slå ihop
            </label>
            <label>
              <input type="radio" name="import-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
              Ersätt allt
            </label>
          </div>
          <button type="button" className="button-primary" onClick={handleImport}>
            Importera
          </button>
        </>
      )}
      {state.kind === 'done' && (
        <p className="success" role="status">
          Klart! {formatNumber(state.foods)} livsmedel och {formatNumber(state.entries)} loggposter lästes in.
        </p>
      )}
    </section>
  )
}
