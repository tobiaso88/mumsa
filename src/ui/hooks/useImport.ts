import { useState } from 'react'
import { importAll, type ImportMode } from '../../data/backup'
import { readJsonFile } from '../../data/backupFile'
import { validateImport, type ExportData } from '../../domain/exportFormat'
import { useDb } from '../dbContext'

export type ImportState =
  | { kind: 'idle' }
  | { kind: 'ready'; data: ExportData; skippedFoods: number }
  | { kind: 'invalid'; error: string }
  | { kind: 'done'; foods: number; entries: number; skippedFoods: number }

/** Läser och validerar en vald fil, så att innehållet kan granskas innan det läses in. */
async function readImportFile(file: File): Promise<ImportState> {
  const read = await readJsonFile(file)
  if (!read.ok) {
    const error = read.reason === 'tooLarge' ? 'Filen är för stor för att vara en export från Mumsa.' : 'Filen är inte giltig JSON.'
    return { kind: 'invalid', error }
  }
  const result = validateImport(read.json)
  if (!result.ok) return { kind: 'invalid', error: result.error }
  return { kind: 'ready', data: result.data, skippedFoods: result.skippedFoods }
}

/** Välj fil, granska innehållet och läs sedan in det i vald form. */
export function useImport() {
  const db = useDb()
  const [state, setState] = useState<ImportState>({ kind: 'idle' })
  const [mode, setMode] = useState<ImportMode>('merge')

  async function chooseFile(file: File | undefined) {
    setState(file ? await readImportFile(file) : { kind: 'idle' })
  }

  async function runImport() {
    if (state.kind !== 'ready') return
    const counts = await importAll(db, state.data, mode)
    setState({ kind: 'done', ...counts, skippedFoods: state.skippedFoods })
  }

  return { state, mode, setMode, chooseFile, runImport }
}
