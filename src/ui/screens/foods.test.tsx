import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../../data/db'
import { getEntriesForDate } from '../../data/entriesRepo'
import productFixture from '../../data/fixtures/off-product.json'
import { createCustomFood, listCustomFoods } from '../../data/foodsRepo'
import { saveGoals } from '../../data/settingsRepo'
import { createTestDb } from '../../data/testDb'
import { App } from '../App'

vi.mock('../../data/livsmedelsverket.json', () => ({
  default: {
    source: 'Livsmedelsverkets livsmedelsdatabas',
    license: 'CC BY 4.0',
    retrieved: '2026-10-23',
    rows: [[702, 'Havregryn fullkorn', 375, 9.5, 64.1, 7]],
  },
}))

let db: MumsaDb
const date = '2026-10-20'

beforeEach(async () => {
  db = createTestDb()
  await saveGoals(db, { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } })
  window.location.hash = `#/lagg-till/${date}/lunch`
})
afterEach(async () => {
  // Avmontera innan databasen tas bort så att inga frågor körs mot en stängd databas
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  await db.delete()
})

async function fill(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const input = await screen.findByLabelText(label)
  await user.clear(input)
  await user.type(input, value)
}

it('skapar ett eget livsmedel och loggar det direkt', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.click(await screen.findByRole('link', { name: 'Eget livsmedel' }))

  const save = await screen.findByRole('button', { name: 'Spara livsmedel' })
  expect(save).toBeDisabled()
  expect(screen.queryByText(/Fyll i energi/)).not.toBeInTheDocument()
  await fill(user, 'Namn', 'Mormors bullar')
  await fill(user, 'Energi', '350')
  await fill(user, 'Protein', '7')
  await fill(user, 'Kolhydrater', '50')
  await fill(user, 'Fett', '13')
  await fill(user, 'Portionsstorlek', '40')
  await fill(user, 'Beskrivning', '1 bulle')
  await user.click(save)

  const dialog = await screen.findByRole('dialog', { name: 'Mormors bullar' })
  expect(within(dialog).getByLabelText('Mängd')).toHaveValue('40')
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till' }))

  await screen.findByRole('heading', { name: /20 oktober/ })
  expect(await getEntriesForDate(db, date)).toMatchObject([{ foodName: 'Mormors bullar', grams: 40, meal: 'lunch' }])
  expect(await listCustomFoods(db)).toMatchObject([{ name: 'Mormors bullar', servingGrams: 40, servingLabel: '1 bulle' }])
})

it('visar fel för omöjliga värden och varnar för energi som inte stämmer', async () => {
  window.location.hash = `#/livsmedel/ny/${date}/lunch`
  const user = userEvent.setup()
  render(<App db={db} />)
  await fill(user, 'Namn', 'Test')
  await fill(user, 'Energi', '50')
  await fill(user, 'Protein', '60')
  await fill(user, 'Kolhydrater', '60')
  await fill(user, 'Fett', '0')
  expect(screen.getByText(/kan inte bli mer än 100 g/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Spara livsmedel' })).toBeDisabled()

  await fill(user, 'Kolhydrater', '10')
  expect(screen.getByRole('status')).toHaveTextContent('Energin stämmer dåligt')
  expect(screen.getByRole('button', { name: 'Spara livsmedel' })).toBeEnabled()
})

it('rättar ett livsmedel från Livsmedelsverket som en egen kopia', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.type(await screen.findByRole('searchbox'), 'havre')
  await user.click(await screen.findByRole('button', { name: /Havregryn fullkorn/ }))
  await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Rätta näringsvärden' }))

  expect(await screen.findByLabelText('Namn')).toHaveValue('Havregryn fullkorn')
  expect(screen.getByLabelText('Energi')).toHaveValue('375')
  await fill(user, 'Energi', '370')
  await user.click(screen.getByRole('button', { name: 'Spara livsmedel' }))

  await screen.findByRole('dialog', { name: 'Havregryn fullkorn' })
  expect(await listCustomFoods(db)).toMatchObject([{ name: 'Havregryn fullkorn', per100g: { kcal: 370, fat: 7 } }])
})

it('ändrar och tar bort ett eget livsmedel', async () => {
  const own = await createCustomFood(db, { name: 'Gröt', per100g: { kcal: 70, protein: 2, carbs: 12, fat: 1 } })
  window.location.hash = `#/livsmedel/andra/${date}/lunch/${encodeURIComponent(own.id)}`
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const user = userEvent.setup()
  render(<App db={db} />)

  await fill(user, 'Namn', 'Havregrynsgröt')
  await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))
  await screen.findByRole('dialog', { name: 'Havregrynsgröt' })
  expect((await listCustomFoods(db))[0]?.name).toBe('Havregrynsgröt')

  await user.click(screen.getByRole('link', { name: 'Ändra livsmedlet' }))
  await user.click(await screen.findByRole('button', { name: 'Ta bort livsmedlet' }))
  await screen.findByRole('heading', { name: 'Lägg till i lunch' })
  expect(await listCustomFoods(db)).toEqual([])
})

describe('skanning', () => {
  beforeEach(() => {
    window.location.hash = `#/skanna/${date}/lunch`
  })

  it('visar fel när kameran saknas och slår upp en inskriven streckkod', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json(productFixture))))
    const user = userEvent.setup()
    render(<App db={db} />)
    expect(await screen.findByText('Kameran kunde inte startas.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Eller skriv in streckkoden'), '7310130321184')
    await user.click(screen.getByRole('button', { name: 'Sök' }))

    const dialog = await screen.findByRole('dialog', { name: 'AXA Fiber havregryn, AXA' })
    expect(within(dialog).getByLabelText('Mängd')).toHaveValue('100')
  })

  it('erbjuder eget livsmedel när produkten saknas', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(Response.json({ status: 0 }, { status: 404 }))))
    const user = userEvent.setup()
    render(<App db={db} />)
    await user.type(await screen.findByLabelText('Eller skriv in streckkoden'), '7310000000001')
    await user.click(screen.getByRole('button', { name: 'Sök' }))

    await user.click(await screen.findByRole('link', { name: 'Skapa eget livsmedel' }))
    expect(await screen.findByLabelText('Streckkod (valfritt)')).toHaveValue('7310000000001')
  })

  it('visar fel och låter användaren försöka igen när nätverket fallerar', async () => {
    const fetch = vi.fn<() => Promise<Response>>(() => Promise.reject(new TypeError('Failed to fetch')))
    vi.stubGlobal('fetch', fetch)
    const user = userEvent.setup()
    render(<App db={db} />)
    await user.type(await screen.findByLabelText('Eller skriv in streckkoden'), '7310130321184')
    await user.click(screen.getByRole('button', { name: 'Sök' }))

    expect(await screen.findByText(/gick inte att nå/)).toBeInTheDocument()
    fetch.mockImplementation(() => Promise.resolve(Response.json(productFixture)))
    await user.click(screen.getByRole('button', { name: 'Försök igen' }))
    expect(await screen.findByRole('dialog', { name: 'AXA Fiber havregryn, AXA' })).toBeInTheDocument()
  })

  it('avbryter uppslaget och stannar kvar när användaren går tillbaka', async () => {
    let respond = () => {}
    let signal: AbortSignal | undefined
    // Svaret kommer först när testet säger till, även om anropet har avbrutits
    const fetch = vi.fn((_url: string, init?: RequestInit) => {
      signal = init?.signal ?? undefined
      return new Promise<Response>((resolve) => (respond = () => resolve(Response.json(productFixture))))
    })
    vi.stubGlobal('fetch', fetch)
    const user = userEvent.setup()
    render(<App db={db} />)
    await user.type(await screen.findByLabelText('Eller skriv in streckkoden'), '7310130321184')
    await user.click(screen.getByRole('button', { name: 'Sök' }))
    await screen.findByText(/Söker efter/)

    await user.click(screen.getByRole('link', { name: 'Tillbaka' }))
    await screen.findByRole('heading', { name: 'Lägg till i lunch' })
    expect(signal?.aborted).toBe(true)

    respond()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(window.location.hash).toBe(`#/lagg-till/${date}/lunch`)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('säger till när enheten är offline', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const user = userEvent.setup()
    render(<App db={db} />)
    await user.type(await screen.findByLabelText('Eller skriv in streckkoden'), '7310130321184')
    await user.click(screen.getByRole('button', { name: 'Sök' }))

    expect(await screen.findByText(/Du är offline/)).toBeInTheDocument()
    onLine.mockRestore()
  })
})
