import { useState } from 'react'
import { importAll, type ImportMode } from '../../data/backup'
import { readJsonFile } from '../../data/backupFile'
import { validateImport, type ExportData } from '../../domain/exportFormat'
import { useDb } from '../dbContext'

export type ImportState =
  | { kind: 'idle' }
  | { kind: 'ready'; json: unknown; data: ExportData }
  | { kind: 'invalid'; error: string }
  | { kind: 'done'; foods: number; entries: number }

/** Välj fil, granska innehållet och läs sedan in det i vald form. */
export function useImport() {
  const db = useDb()
  const [state, setState] = useState<ImportState>({ kind: 'idle' })
  const [mode, setMode] = useState<ImportMode>('merge')

  async function chooseFile(file: File | undefined) {
    if (!file) return setState({ kind: 'idle' })
    const json = await readJsonFile(file)
    const result = validateImport(json)
    setState(result.ok ? { kind: 'ready', json, data: result.data } : { kind: 'invalid', error: json === null ? 'Filen är inte giltig JSON.' : result.error })
  }

  async function runImport() {
    if (state.kind !== 'ready') return
    const outcome = await importAll(db, state.json, mode)
    setState(outcome.ok ? { kind: 'done', foods: outcome.foods, entries: outcome.entries } : { kind: 'invalid', error: outcome.error })
  }

  return { state, mode, setMode, chooseFile, runImport }
}
