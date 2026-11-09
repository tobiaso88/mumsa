import { useId, useRef, useState } from 'react'
import { useAction } from '../hooks/useAction'
import { useExport } from '../hooks/useExport'
import { useImport } from '../hooks/useImport'
import { ImportSheet } from './ImportSheet'
import { ListGroup } from './ListGroup'

export function BackupSection() {
  const importer = useImport()
  const exporter = useExport()
  const [exported, setExported] = useState(false)
  const fileId = useId()
  const fileInput = useRef<HTMLInputElement>(null)

  const exporting = useAction(async () => {
    await exporter.download()
    setExported(true)
  }, 'Datan kunde inte exporteras. Försök igen.')

  const sharing = useAction(async () => {
    setExported(false)
    if ((await exporter.share()) === 'shared') setExported(true)
  }, 'Datan kunde inte delas. Försök igen.')

  function closeImport() {
    void importer.chooseFile(undefined)
    // Samma fil ska gå att välja igen
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <>
      <ListGroup
        title="Säkerhetskopia"
        rows={[
          ...(exporter.canShare
            ? [{ label: 'Dela eller spara i molnet', icon: 'share' as const, tint: 'var(--fat)', accent: true, onClick: () => void sharing.run(), disabled: sharing.pending }]
            : []),
          { label: 'Exportera data', icon: 'download', tint: 'var(--fat)', accent: true, onClick: () => void exporting.run(), disabled: exporting.pending },
          { label: 'Importera från fil', icon: 'upload', tint: 'var(--fat)', accent: true, htmlFor: fileId },
        ]}
        footer={
          <>
            <p>En JSON-fil med alla livsmedel, loggposter och vägningar, till exempel för att flytta till en annan enhet.</p>
            {exporter.canShare && (
              <p>Med Dela kan du spara filen i Filer, iCloud Drive eller Google Drive. Appen skickar inget själv, och du läser in filen igen med Importera.</p>
            )}
            {exported && <p className="success-text" role="status">Filen är sparad.</p>}
            {(exporting.error ?? sharing.error) && <p className="error" role="alert">{exporting.error ?? sharing.error}</p>}
          </>
        }
      />
      <input
        ref={fileInput}
        id={fileId}
        className="visually-hidden"
        type="file"
        accept=".json,application/json"
        onChange={(e) => void importer.chooseFile(e.target.files?.[0])}
      />
      {importer.state.kind !== 'idle' && <ImportSheet importer={importer} onClose={closeImport} />}
    </>
  )
}
