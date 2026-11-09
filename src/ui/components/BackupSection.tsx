import { useId, useRef, useState } from 'react'
import { useAction } from '../hooks/useAction'
import { useExport } from '../hooks/useExport'
import { useImport } from '../hooks/useImport'
import { ImportSheet } from './ImportSheet'
import { ListGroup } from './ListGroup'

export function BackupSection() {
  const importer = useImport()
  const exportData = useExport()
  const [exported, setExported] = useState(false)
  const fileId = useId()
  const fileInput = useRef<HTMLInputElement>(null)

  const exporting = useAction(async () => {
    await exportData()
    setExported(true)
  }, 'Datan kunde inte exporteras. Försök igen.')

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
          { label: 'Exportera data', icon: 'download', tint: 'var(--fat)', accent: true, onClick: () => void exporting.run(), disabled: exporting.pending },
          { label: 'Importera från fil', icon: 'upload', tint: 'var(--fat)', accent: true, htmlFor: fileId },
        ]}
        footer={
          <>
            <p>En JSON-fil med alla livsmedel, loggposter och vägningar, till exempel för att flytta till en annan enhet.</p>
            {exported && <p className="success-text" role="status">Filen är sparad.</p>}
            {exporting.error && <p className="error" role="alert">{exporting.error}</p>}
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
