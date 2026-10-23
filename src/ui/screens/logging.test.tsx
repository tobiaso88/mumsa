import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../../data/db'
import { addEntry, getEntriesForDate } from '../../data/entriesRepo'
import { cacheOffFoods } from '../../data/foodsRepo'
import { saveGoals } from '../../data/settingsRepo'
import { createTestDb } from '../../data/testDb'
import { toIsoDate } from '../../domain/dates'
import { makeFood } from '../../domain/testData'
import { App } from '../App'

vi.mock('../../data/livsmedelsverket.json', () => ({
  default: {
    source: 'Livsmedelsverkets livsmedelsdatabas',
    license: 'CC BY 4.0',
    retrieved: '2026-10-23',
    rows: [
      [702, 'Havregryn fullkorn', 375, 9.5, 64.1, 7],
      [123, 'Mjölk fett 3% berikad', 60, 3.6, 4.6, 3],
    ],
  },
}))

let db: MumsaDb
const today = toIsoDate(new Date())
const oats = { kcal: 375, protein: 9.5, carbs: 64.1, fat: 7 }

beforeEach(async () => {
  db = createTestDb()
  await saveGoals(db, { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } })
  window.location.hash = ''
})
afterEach(() => db.delete())

it('visar dagens intag mot målet och per måltid', async () => {
  await addEntry(db, { date: today, meal: 'breakfast', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 80, per100g: oats })
  render(<App db={db} />)

  expect(await screen.findByRole('heading', { name: 'Idag' })).toBeInTheDocument()
  expect(screen.getByText('1 700')).toBeInTheDocument() // 2000 − 300
  expect(screen.getByText('kcal kvar')).toBeInTheDocument()
  const breakfast = screen.getByRole('region', { name: 'Frukost' })
  expect(within(breakfast).getByText('Havregryn fullkorn')).toBeInTheDocument()
  expect(within(breakfast).getByText('80 g · 300 kcal')).toBeInTheDocument()
  expect(within(screen.getByRole('region', { name: 'Lunch' })).getByText('0 kcal')).toBeInTheDocument()
})

it('lägger till ett livsmedel från sökningen', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.click(await screen.findByRole('link', { name: 'Lägg till i lunch' }))

  await user.type(await screen.findByRole('searchbox', { name: 'Sök livsmedel' }), 'havre')
  await user.click(await screen.findByRole('button', { name: /Havregryn fullkorn/ }))

  const dialog = screen.getByRole('dialog', { name: 'Havregryn fullkorn' })
  const amount = within(dialog).getByLabelText('Mängd')
  expect(amount).toHaveValue('100')
  await user.clear(amount)
  await user.type(amount, '40')
  expect(within(dialog).getByText('150')).toBeInTheDocument() // 375 × 0,4
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till' }))

  const lunch = await screen.findByRole('region', { name: 'Lunch' })
  expect(await within(lunch).findByText('40 g · 150 kcal')).toBeInTheDocument()
  expect(await getEntriesForDate(db, today)).toMatchObject([
    { meal: 'lunch', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 40, per100g: oats },
  ])
})

it('räknar om portioner till gram och visar senast loggade', async () => {
  const bread = makeFood({ id: 'off:1', source: 'off', name: 'Knäckebröd', brand: 'Leksands', servingGrams: 12, servingLabel: '1 skiva' })
  await cacheOffFoods(db, [bread])
  await addEntry(db, { date: '2026-01-01', meal: 'snack', foodId: bread.id, foodName: 'Knäckebröd', grams: 12, per100g: bread.per100g })
  window.location.hash = `#/lagg-till/${today}/frukost`
  const user = userEvent.setup()
  render(<App db={db} />)

  const recent = await screen.findByRole('list', { name: 'Senast loggade' })
  await user.click(within(recent).getByRole('button', { name: /Knäckebröd/ }))
  const dialog = screen.getByRole('dialog', { name: 'Knäckebröd, Leksands' })
  expect(within(dialog).getByLabelText('Mängd')).toHaveValue('12')

  await user.click(within(dialog).getByLabelText('Portioner'))
  const amount = within(dialog).getByLabelText('Mängd')
  expect(amount).toHaveValue('1')
  await user.clear(amount)
  await user.type(amount, '2,5')
  expect(within(dialog).getByText('Motsvarar 30 g.')).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till' }))

  await screen.findByRole('heading', { name: 'Idag' })
  expect(await getEntriesForDate(db, today)).toMatchObject([{ meal: 'breakfast', grams: 30, foodName: 'Knäckebröd, Leksands' }])
})

it('ändrar och tar bort en loggpost', async () => {
  await addEntry(db, { date: today, meal: 'breakfast', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 80, per100g: oats })
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.click(await screen.findByRole('button', { name: /Havregryn fullkorn/ }))
  let dialog = screen.getByRole('dialog', { name: 'Havregryn fullkorn' })
  const amount = within(dialog).getByLabelText('Mängd')
  await user.clear(amount)
  await user.type(amount, '60')
  await user.selectOptions(within(dialog).getByLabelText('Måltid'), 'snack')
  await user.click(within(dialog).getByRole('button', { name: 'Spara' }))

  const snack = screen.getByRole('region', { name: 'Mellanmål' })
  expect(await within(snack).findByText('60 g · 225 kcal')).toBeInTheDocument()

  await user.click(within(snack).getByRole('button', { name: /Havregryn fullkorn/ }))
  dialog = screen.getByRole('dialog', { name: 'Havregryn fullkorn' })
  await user.click(within(dialog).getByRole('button', { name: 'Ta bort' }))
  expect(await screen.findByText('2 000')).toBeInTheDocument()
  expect(await getEntriesForDate(db, today)).toEqual([])
})

it('stänger panelen med Escape utan att spara', async () => {
  await addEntry(db, { date: today, meal: 'lunch', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 80, per100g: oats })
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.click(await screen.findByRole('button', { name: /Havregryn fullkorn/ }))
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect((await getEntriesForDate(db, today))[0]?.grams).toBe(80)
})
