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

it('hoppar över livsmedel från Livsmedelsverket och berättar det', async () => {
  const exported = await exportAll(db)
  const slv = { id: 'slv:702', name: 'Havregryn', source: 'slv', per100g: makeEntry().per100g, updatedAt: '2026-10-23' }
  const own = { ...slv, id: 'custom:eget', name: 'Eget', source: 'custom' }
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.upload(await screen.findByLabelText('Importera från fil'), jsonFile({ ...exported, foods: [slv, own] }))
  expect(await screen.findByText('Filen innehåller 1 livsmedel och 0 loggposter.')).toBeInTheDocument()
  expect(screen.getByText(/1 livsmedel från Livsmedelsverket hoppas över/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Importera' }))

  expect(await screen.findByText(/Klart! 1 livsmedel och 0 loggposter lästes in./)).toBeInTheDocument()
  expect(screen.getByText(/1 livsmedel från Livsmedelsverket hoppades över/)).toBeInTheDocument()
  expect((await db.foods.toArray()).map((f) => f.id)).toEqual(['custom:eget'])
})

it('visar ett fel och behåller datan om importen inte går att skriva', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  await addEntry(db, { date: '2026-10-20', meal: 'lunch', foodId: 'a', foodName: 'Befintlig', grams: 10, per100g: makeEntry().per100g })
  const exported = await exportAll(db)
  vi.spyOn(db.entries, 'bulkPut').mockRejectedValueOnce(new Error('QuotaExceededError'))
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.upload(await screen.findByLabelText('Importera från fil'), jsonFile({ ...exported, entries: [makeEntry({ id: 'ny' })] }))
  await user.click(await screen.findByRole('button', { name: 'Importera' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Filen kunde inte läsas in. Ingen data har ändrats.')
  expect((await getEntriesForDate(db, '2026-10-20')).map((e) => e.foodName)).toEqual(['Befintlig'])
})

it.each([
  ['ogiltig JSON', 'inte json', 'Filen är inte giltig JSON.'],
  ['fel app', { app: 'annan' }, 'Filen är inte en export från Mumsa.'],
  ['nyare version', { app: 'mumsa', version: 99, foods: [], entries: [] }, 'Filen kommer från en nyare version av Mumsa.'],
])('visar fel för %s', async (_, content, message) => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.upload(await screen.findByLabelText('Importera från fil'), jsonFile(content))
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
  expect(screen.queryByRole('button', { name: 'Importera' })).not.toBeInTheDocument()
})

it('går att nå utan mål och behåller kvittot när importen skapar ett mål', async () => {
  const exported = await exportAll(db)
  await db.settings.clear()
  window.location.hash = ''
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.click(await screen.findByRole('link', { name: /Importera en säkerhetskopia/ }))
  await user.upload(await screen.findByLabelText('Importera från fil'), jsonFile(exported))
  await user.click(await screen.findByRole('button', { name: 'Importera' }))

  expect(await screen.findByText(/Klart!/)).toBeInTheDocument()
  expect(await screen.findByRole('navigation', { name: 'Huvudmeny' })).toBeInTheDocument()
  expect(screen.getByText(/Klart!/)).toBeInTheDocument()
})

it('anger Livsmedelsverket och Open Food Facts som källor', async () => {
  render(<App db={db} />)
  expect(await screen.findByText(/Källa: Livsmedelsverkets livsmedelsdatabas \(CC BY 4.0\)/)).toBeInTheDocument()
  expect(screen.getByText(/Open Food Facts \(ODbL\)/)).toBeInTheDocument()
  expect(screen.getByText(/ger inga medicinska råd/)).toBeInTheDocument()
})
