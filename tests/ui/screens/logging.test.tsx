import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../../../src/data/db/db'
import { addEntry, getEntriesForDate } from '../../../src/data/repos/entriesRepo'
import { cacheOffFoods } from '../../../src/data/repos/foodsRepo'
import { saveGoals } from '../../../src/data/repos/settingsRepo'
import { createTestDb } from '../../helpers/testDb'
import { toIsoDate } from '../../../src/domain/dates'
import { makeFood } from '../../helpers/testData'
import { App } from '../../../src/ui/App'

vi.mock('../../../src/data/sources/livsmedelsverket.json', () => ({
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
// Avmontera innan databasen tas bort så att inga frågor körs mot en stängd databas
afterEach(async () => {
  cleanup()
  await db.delete()
})

it('visar dagens intag mot målet och per måltid', async () => {
  await addEntry(db, { date: today, meal: 'breakfast', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 80, per100g: oats })
  render(<App db={db} />)

  expect(await screen.findByRole('heading', { name: 'Idag' })).toBeInTheDocument()
  expect(screen.getByText('1 700')).toBeInTheDocument() // 2000 − 300
  expect(screen.getByText('kcal kvar')).toBeInTheDocument()
  const breakfast = screen.getByRole('region', { name: 'Frukost' })
  expect(within(breakfast).getByText('Havregryn fullkorn')).toBeInTheDocument()
  expect(within(breakfast).getByRole('button', { name: 'Havregryn fullkorn, 80 g, 300 kcal' })).toBeInTheDocument()
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
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))

  const lunch = await screen.findByRole('region', { name: 'Lunch' })
  expect(await within(lunch).findByRole('button', { name: 'Havregryn fullkorn, 40 g, 150 kcal' })).toBeInTheDocument()
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
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i frukost' }))

  await screen.findByRole('heading', { name: 'Idag' })
  expect(await getEntriesForDate(db, today)).toMatchObject([{ meal: 'breakfast', grams: 30, foodName: 'Knäckebröd, Leksands' }])
})

it('behåller exakt mängd i gram när enheten byts fram och tillbaka', async () => {
  const bread = makeFood({ id: 'off:1', source: 'off', name: 'Knäckebröd', servingGrams: 30 })
  await cacheOffFoods(db, [bread])
  window.location.hash = `#/lagg-till/${today}/frukost/${bread.id}`
  const user = userEvent.setup()
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Knäckebröd' })
  const amount = within(dialog).getByLabelText('Mängd')
  await user.clear(amount)
  await user.type(amount, '10')
  await user.click(within(dialog).getByLabelText('Portioner'))
  expect(amount).toHaveValue('0,33')
  expect(within(dialog).getByText('Motsvarar 10 g.')).toBeInTheDocument()
  await user.click(within(dialog).getByLabelText('Gram'))
  expect(amount).toHaveValue('10')
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i frukost' }))

  await screen.findByRole('heading', { name: 'Idag' })
  expect(await getEntriesForDate(db, today)).toMatchObject([{ grams: 10 }])
})

it('räknar om dl och msk till gram med Livsmedelsverkets mått', async () => {
  window.location.hash = `#/lagg-till/${today}/frukost/slv:702`
  const user = userEvent.setup()
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Havregryn fullkorn' })
  // Måtten kommer från den riktiga filen med Livsmedelsverkets volymvikter
  await user.click(within(dialog).getByLabelText('dl'))
  const amount = within(dialog).getByLabelText('Mängd')
  await user.clear(amount)
  await user.type(amount, '2')
  expect(within(dialog).getByText('1 dl väger ungefär 39 g enligt Livsmedelsverket.')).toBeInTheDocument()
  expect(within(dialog).getByText('Motsvarar 78 g.')).toBeInTheDocument()

  await user.click(within(dialog).getByLabelText('msk'))
  expect(amount).toHaveValue('13')
  expect(within(dialog).getByText('Motsvarar 78 g.')).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i frukost' }))

  await screen.findByRole('heading', { name: 'Idag' })
  expect(await getEntriesForDate(db, today)).toMatchObject([{ foodId: 'slv:702', grams: 78 }])
})

it('börjar på 1 dl när enheten byts innan mängden har ändrats', async () => {
  window.location.hash = `#/lagg-till/${today}/frukost/slv:702`
  const user = userEvent.setup()
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Havregryn fullkorn' })
  const amount = within(dialog).getByLabelText('Mängd')
  await user.click(within(dialog).getByLabelText('dl'))
  expect(amount).toHaveValue('1')
  expect(within(dialog).getByText('Motsvarar 39 g.')).toBeInTheDocument()
  await user.click(within(dialog).getByLabelText('Gram'))
  expect(amount).toHaveValue('100')
})

it('räknar om en sparad mängd till dl när en loggpost ändras', async () => {
  await addEntry(db, { date: today, meal: 'breakfast', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 78, per100g: oats })
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.click(await screen.findByRole('button', { name: 'Havregryn fullkorn, 78 g, 293 kcal' }))
  const dialog = screen.getByRole('dialog', { name: 'Havregryn fullkorn' })
  await user.click(await within(dialog).findByLabelText('dl'))
  expect(within(dialog).getByLabelText('Mängd')).toHaveValue('2')
})

it('visar bara gram för livsmedel utan mått och portion', async () => {
  const cheese = makeFood({ id: 'off:2', source: 'off', name: 'Ost' })
  await cacheOffFoods(db, [cheese])
  window.location.hash = `#/lagg-till/${today}/frukost/${cheese.id}`
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Ost' })
  expect(within(dialog).queryByRole('radiogroup', { name: 'Enhet' })).not.toBeInTheDocument()
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
  await user.click(within(dialog).getByLabelText('Mellanmål'))
  await user.click(within(dialog).getByRole('button', { name: 'Spara' }))

  const snack = screen.getByRole('region', { name: 'Mellanmål' })
  expect(await within(snack).findByRole('button', { name: 'Havregryn fullkorn, 60 g, 225 kcal' })).toBeInTheDocument()

  await user.click(within(snack).getByRole('button', { name: /Havregryn fullkorn/ }))
  dialog = screen.getByRole('dialog', { name: 'Havregryn fullkorn' })
  await user.click(within(dialog).getByRole('button', { name: 'Ta bort' }))
  expect(await screen.findByText('2 000')).toBeInTheDocument()
  expect(await getEntriesForDate(db, today)).toEqual([])
})

it('visar ett fel och låter panelen vara öppen om posten inte går att spara', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(db.entries, 'add').mockRejectedValueOnce(new Error('QuotaExceededError'))
  window.location.hash = `#/lagg-till/${today}/lunch/slv%3A702`
  const user = userEvent.setup()
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Havregryn fullkorn' })
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))

  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Livsmedlet kunde inte loggas. Försök igen.')
  expect(within(dialog).getByRole('button', { name: 'Lägg till i lunch' })).toBeEnabled()
  expect(await getEntriesForDate(db, today)).toEqual([])

  // Andra försöket lyckas
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))
  expect(await screen.findByRole('heading', { name: 'Idag' })).toBeInTheDocument()
  expect(await getEntriesForDate(db, today)).toHaveLength(1)
  consoleError.mockRestore()
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

it('stegar mängden med plus och minus', async () => {
  window.location.hash = `#/lagg-till/${today}/lunch/slv%3A702`
  const user = userEvent.setup()
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Havregryn fullkorn' })
  const amount = within(dialog).getByLabelText('Mängd')
  await user.click(within(dialog).getByRole('button', { name: 'Öka' }))
  expect(amount).toHaveValue('110')
  await user.click(within(dialog).getByRole('button', { name: 'Minska' }))
  await user.click(within(dialog).getByRole('button', { name: 'Minska' }))
  expect(amount).toHaveValue('90')
  await user.click(within(dialog).getByLabelText('Middag'))
  expect(within(dialog).getByRole('button', { name: 'Lägg till i middag' })).toBeEnabled()
})
