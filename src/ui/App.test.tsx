import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../data/db'
import { getGoals, getProfile, saveGoals } from '../data/settingsRepo'
import { createTestDb } from '../data/testDb'
import { App } from './App'

let db: MumsaDb
beforeEach(() => {
  db = createTestDb()
  window.location.hash = ''
})
// Avmontera innan databasen tas bort så att inga frågor körs mot en stängd databas
afterEach(async () => {
  cleanup()
  await db.delete()
})

const goals = { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } }

it('visar introduktionen när inget mål är satt och dagsvyn efter att målet sparats', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  expect(await screen.findByRole('heading', { name: 'Välkommen till Mumsa' })).toBeInTheDocument()

  await user.click(screen.getByLabelText('Ange själv'))
  await user.type(screen.getByLabelText('Kalorimål per dag'), '1900')
  await user.click(screen.getByRole('button', { name: 'Kom igång' }))

  expect(await screen.findByText('0 av 1 900 kcal')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Huvudmeny' })).toBeInTheDocument()
  expect(await getGoals(db)).toEqual({ kcal: 1900, split: goals.split })
})

it('räknar ut mål från profilen och sparar profilen', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await screen.findByRole('heading', { name: 'Välkommen till Mumsa' })

  const start = screen.getByRole('button', { name: 'Kom igång' })
  expect(start).toBeDisabled()
  await user.type(screen.getByLabelText('Vikt'), '70')
  await user.type(screen.getByLabelText('Längd'), '175')
  await user.type(screen.getByLabelText('Ålder'), '30')
  await user.click(screen.getByLabelText('Man'))
  await user.selectOptions(screen.getByLabelText('Aktivitetsnivå'), 'moderate')

  // 1648,75 × 1,55 ≈ 2556
  expect(screen.getByText('2 556 kcal')).toBeInTheDocument()
  expect(screen.getByText(/ingen rekommendation eller medicinsk bedömning/)).toBeInTheDocument()
  await user.click(start)

  expect(await screen.findByText('0 av 2 556 kcal')).toBeInTheDocument()
  expect(await getProfile(db)).toEqual({ weightKg: 70, heightCm: 175, ageYears: 30, sex: 'male', activity: 'moderate' })
})

it('kräver att makrofördelningen blir 100 %', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.click(await screen.findByLabelText('Ange själv'))
  await user.type(screen.getByLabelText('Kalorimål per dag'), '2000')
  const protein = screen.getByLabelText('Protein')
  await user.clear(protein)
  await user.type(protein, '40')

  expect(screen.getByRole('alert')).toHaveTextContent('nu blir de 115 %')
  expect(screen.getByRole('button', { name: 'Kom igång' })).toBeDisabled()
})

it('låter användaren ändra målet på profilsidan', async () => {
  await saveGoals(db, goals)
  window.location.hash = '#/profil'
  const user = userEvent.setup()
  render(<App db={db} />)

  const kcal = await screen.findByLabelText('Kalorimål per dag')
  expect(kcal).toHaveValue('2000')
  await user.clear(kcal)
  await user.type(kcal, '1800')
  await user.click(screen.getByRole('button', { name: 'Spara mål' }))

  expect(await screen.findByRole('status')).toHaveTextContent('Målet är sparat.')
  expect((await getGoals(db))?.kcal).toBe(1800)
})
