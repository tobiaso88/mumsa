import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../../data/db'
import { saveGoals } from '../../data/settingsRepo'
import { createTestDb } from '../../data/testDb'
import { getWeights, logWeight } from '../../data/weightsRepo'
import { addDays, toIsoDate } from '../../domain/dates'
import { App } from '../App'

let db: MumsaDb
const today = toIsoDate(new Date())
const split = { proteinPct: 25, carbsPct: 45, fatPct: 30 }

beforeEach(async () => {
  db = createTestDb()
  await saveGoals(db, { kcal: 2000, split, objective: { kind: 'lose', pace: 'slow' }, targetWeightKg: 75 })
  window.location.hash = '#/vikt'
})
// Avmontera innan databasen tas bort så att inga frågor körs mot en stängd databas
afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  await db.delete()
})

it('loggar dagens vikt och visar läget mot målvikten', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  expect(await screen.findByText('Logga din vikt för att följa hur den förändras över tid.')).toBeInTheDocument()

  await user.type(screen.getByLabelText('Vikt'), '80,2')
  await user.click(screen.getByRole('button', { name: 'Spara vikt' }))

  expect(await screen.findByRole('status')).toHaveTextContent('Vikten är sparad.')
  expect(await getWeights(db)).toMatchObject([{ date: today, kg: 80.2 }])
  const progress = screen.getByRole('region', { name: 'Viktförändring' })
  expect(within(progress).getByText('80,2 kg')).toBeInTheDocument()
  expect(within(progress).getByText('5,2 kg kvar till målvikten 75 kg.')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /Vikt: .* 80,2 kg\. Målvikt 75 kg\./ })).toBeInTheDocument()
})

it('visar förändring och snitt per vecka', async () => {
  await logWeight(db, addDays(today, -28), 80)
  await logWeight(db, addDays(today, -14), 79)
  await logWeight(db, today, 78)
  render(<App db={db} />)

  const progress = await screen.findByRole('region', { name: 'Viktförändring' })
  expect(progress).toHaveTextContent('−2 kg sedan')
  expect(progress).toHaveTextContent('i snitt −0,5 kg per vecka den senaste månaden')
  expect(within(progress).getByText('3 kg kvar till målvikten 75 kg.')).toBeInTheDocument()
})

it('ersätter en vägning samma dag och tar bort en vägning', async () => {
  await logWeight(db, today, 81)
  await logWeight(db, addDays(today, -7), 82)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const user = userEvent.setup()
  render(<App db={db} />)

  expect(await screen.findByText('Ersätter vägningen på 81 kg den dagen.')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Vikt'), '80,5')
  await user.click(screen.getByRole('button', { name: 'Spara vikt' }))
  expect(await screen.findByText('Ersätter vägningen på 80,5 kg den dagen.')).toBeInTheDocument()

  const list = screen.getByRole('list')
  expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  await user.click(within(list).getAllByRole('button', { name: /Ta bort vägningen/ })[1]!)
  expect(await getWeights(db)).toMatchObject([{ date: today, kg: 80.5 }])
})

it('visar när målvikten är nådd', async () => {
  await logWeight(db, addDays(today, -7), 76)
  await logWeight(db, today, 74.8)
  render(<App db={db} />)
  expect(await screen.findByText('Du har nått din målvikt på 75 kg.')).toBeInTheDocument()
})

it('nås från bottenmenyn', async () => {
  window.location.hash = '#/dag'
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.click(await screen.findByRole('link', { name: 'Vikt' }))
  expect(await screen.findByRole('heading', { name: 'Vikt' })).toBeInTheDocument()
})
