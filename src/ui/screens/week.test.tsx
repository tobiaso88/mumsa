import { cleanup, render, screen, within } from '@testing-library/react'
import type { MumsaDb } from '../../data/db'
import { addEntry } from '../../data/entriesRepo'
import { saveGoals } from '../../data/settingsRepo'
import { createTestDb } from '../../data/testDb'
import { App } from '../App'

let db: MumsaDb
const per100g = { kcal: 100, protein: 10, carbs: 10, fat: 2 }

async function log(date: string, grams: number) {
  await addEntry(db, { date, meal: 'lunch', foodId: 'x', foodName: 'Mat', grams, per100g })
}

beforeEach(async () => {
  db = createTestDb()
  await saveGoals(db, { kcal: 2000, split: { proteinPct: 20, carbsPct: 50, fatPct: 30 } })
  window.location.hash = '#/vecka/2026-10-21'
})
// Avmontera innan databasen tas bort så att inga frågor körs mot en stängd databas
afterEach(async () => {
  cleanup()
  await db.delete()
})

it('visar veckans dagar, snitt och diagram', async () => {
  await log('2026-10-19', 1800) // 1800 kcal
  await log('2026-10-21', 2400) // 2400 kcal, över målet
  await log('2026-10-26', 1000) // nästa vecka
  render(<App db={db} />)

  expect(await screen.findByRole('heading', { name: 'Vecka 43' })).toBeInTheDocument()
  expect(screen.getByText('19 okt – 25 okt')).toBeInTheDocument()

  const average = screen.getByRole('region', { name: 'Snitt per dag' })
  expect(within(average).getByText('Räknat på 2 av 7 dagar.')).toBeInTheDocument()
  expect(within(average).getByText('2 100 / 2 000 kcal')).toBeInTheDocument()
  expect(within(average).getByText('210 / 100 g')).toBeInTheDocument() // protein

  const days = within(screen.getByRole('list', { name: 'Dagar' })).getAllByRole('link')
  expect(days.map((d) => d.textContent)).toEqual([
    'måndag 19 oktober1\u00a0800 kcal',
    'tisdag 20 oktoberInget loggat',
    'onsdag 21 oktober2\u00a0400 kcal',
    'torsdag 22 oktoberInget loggat',
    'fredag 23 oktoberInget loggat',
    'lördag 24 oktoberInget loggat',
    'söndag 25 oktoberInget loggat',
  ])
  expect(days[2]).toHaveAttribute('href', '#/dag/2026-10-21')

  const chart = screen.getByRole('img', { name: /Energi per dag/ })
  expect(chart).toHaveAccessibleName(expect.stringContaining('mån 1\u00a0800 kcal, tis 0 kcal, ons 2\u00a0400 kcal'))
  expect(chart.querySelectorAll('rect.bar')).toHaveLength(2)
  expect(chart.querySelectorAll('rect.bar-over')).toHaveLength(1)
})

it('visar tom vecka och länkar till föregående och nästa vecka', async () => {
  render(<App db={db} />)
  expect(await screen.findByText('Inget loggat den här veckan.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Föregående vecka' })).toHaveAttribute('href', '#/vecka/2026-10-12')
  expect(screen.getByRole('link', { name: 'Nästa vecka' })).toHaveAttribute('href', '#/vecka/2026-10-26')
})
