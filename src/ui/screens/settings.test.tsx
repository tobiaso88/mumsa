import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { exportAll } from '../../data/backup'
import type { MumsaDb } from '../../data/db'
import { addEntry, getEntriesForDate } from '../../data/entriesRepo'
import { saveGoals } from '../../data/settingsRepo'
import { createTestDb } from '../../data/testDb'
import { makeEntry } from '../../domain/testData'
import { App } from '../App'

let db: MumsaDb
const goals = { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } }

beforeEach(async () => {
  db = createTestDb()
  await saveGoals(db, goals)
  window.location.hash = '#/installningar'
})
// Avmontera innan databasen tas bort så att inga frågor körs mot en stängd databas
afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  await db.delete()
})

function jsonFile(content: unknown, name = 'backup.json') {
  return new File([typeof content === 'string' ? content : JSON.stringify(content)], name, { type: 'application/json' })
}

it('exporterar all data som en JSON-fil', async () => {
  await addEntry(db, { date: '2026-10-20', meal: 'lunch', foodId: 'slv:702', foodName: 'Havregryn', grams: 40, per100g: makeEntry().per100g })
  const blobs: Blob[] = []
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    blobs.push(blob as Blob)
    return 'blob:mumsa'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toMatch(/^mumsa-backup-\d{4}-\d{2}-\d{2}\.json$/)
  })
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.click(await screen.findByRole('button', { name: 'Exportera data' }))
  expect(await screen.findByText('Filen är sparad.')).toBeInTheDocument()
  expect(click).toHaveBeenCalledOnce()
  const data = JSON.parse(await blobs[0]!.text())
  expect(data).toMatchObject({ app: 'mumsa', version: 1, goals, entries: [{ foodName: 'Havregryn', grams: 40 }] })
})

it('slår ihop en importerad fil med befintlig data', async () => {
  await addEntry(db, { date: '2026-10-20', meal: 'lunch', foodId: 'a', foodName: 'Befintlig', grams: 10, per100g: makeEntry().per100g })
  const exported = await exportAll(db)
  const file = jsonFile({ ...exported, entries: [makeEntry({ id: 'ny', date: '2026-10-20', foodName: 'Importerad' })] })
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.upload(await screen.findByLabelText('Importera från fil'), file)
  expect(await screen.findByText('Filen innehåller 0 livsmedel och 1 loggposter.')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Importera' }))

  expect(await screen.findByText(/Klart! 0 livsmedel och 1 loggposter lästes in./)).toBeInTheDocument()
  expect((await getEntriesForDate(db, '2026-10-20')).map((e) => e.foodName).sort()).toEqual(['Befintlig', 'Importerad'])
})

it('ersätter all data först efter bekräftelse', async () => {
  await addEntry(db, { date: '2026-10-20', meal: 'lunch', foodId: 'a', foodName: 'Befintlig', grams: 10, per100g: makeEntry().per100g })
  const exported = await exportAll(db)
  const file = jsonFile({ ...exported, entries: [makeEntry({ id: 'ny', date: '2026-10-20', foodName: 'Importerad' })] })
  const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.upload(await screen.findByLabelText('Importera från fil'), file)
  await user.click(await screen.findByLabelText('Ersätt allt'))
  await user.click(screen.getByRole('button', { name: 'Importera' }))
  expect(confirm).toHaveBeenCalledTimes(1)
  expect((await getEntriesForDate(db, '2026-10-20')).map((e) => e.foodName)).toEqual(['Befintlig'])

  await user.click(screen.getByRole('button', { name: 'Importera' }))
  await screen.findByText(/Klart!/)
  expect((await getEntriesForDate(db, '2026-10-20')).map((e) => e.foodName)).toEqual(['Importerad'])
})

it.each([
  ['ogiltig JSON', 'inte json', 'Filen är inte giltig JSON.'],
  ['fel app', { app: 'annan' }, 'Filen är inte en export från Mumsa.'],
])('visar fel för %s', async (_, content, message) => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.upload(await screen.findByLabelText('Importera från fil'), jsonFile(content))
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(screen.queryByRole('button', { name: 'Importera' })).not.toBeInTheDocument()
})

it('anger Livsmedelsverket och Open Food Facts som källor', async () => {
  render(<App db={db} />)
  expect(await screen.findByText(/Källa: Livsmedelsverkets livsmedelsdatabas \(CC BY 4.0\)/)).toBeInTheDocument()
  expect(screen.getByText(/Open Food Facts \(ODbL\)/)).toBeInTheDocument()
  expect(screen.getByText(/ger inga medicinska råd/)).toBeInTheDocument()
})
