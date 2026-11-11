import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../../../src/data/db/db'
import { addEntry, getEntriesForDate } from '../../../src/data/repos/entriesRepo'
import { getFavoriteIds, saveFavoriteIds, saveGoals } from '../../../src/data/repos/settingsRepo'
import { addDays, toIsoDate } from '../../../src/domain/dates'
import { App } from '../../../src/ui/App'
import { createTestDb } from '../../helpers/testDb'

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
const yesterday = addDays(today, -1)
const twoDaysAgo = addDays(today, -2)
const oats = { kcal: 375, protein: 9.5, carbs: 64.1, fat: 7 }
const milk = { kcal: 60, protein: 3.6, carbs: 4.6, fat: 3 }

beforeEach(async () => {
  db = createTestDb()
  await saveGoals(db, { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } })
  window.location.hash = ''
})
afterEach(async () => {
  cleanup()
  await db.delete()
})

describe('snabbregistrering av kalorier', () => {
  it('loggar bara kalorier med ett eget namn', async () => {
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kalorier' }))
    const dialog = screen.getByRole('dialog', { name: 'Snabbregistrering' })
    expect(within(dialog).getByRole('button', { name: 'Lägg till i lunch' })).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Namn (valfritt)'), 'Pizza')
    await user.type(within(dialog).getByLabelText('Energi'), '650')
    await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))

    const lunch = await screen.findByRole('region', { name: 'Lunch' })
    expect(await within(lunch).findByRole('button', { name: 'Pizza, 650 kcal' })).toBeInTheDocument()
    expect(screen.getByText('1 350')).toBeInTheDocument() // 2000 − 650
    expect(await getEntriesForDate(db, today)).toMatchObject([{ meal: 'lunch', foodId: 'quick:kcal', foodName: 'Pizza', grams: 650 }])
  })

  it('kallar posten Snabbregistrering när inget namn anges och byter måltid', async () => {
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kalorier' }))
    const dialog = screen.getByRole('dialog', { name: 'Snabbregistrering' })
    await user.type(within(dialog).getByLabelText('Energi'), '1 200')
    expect(within(dialog).getByRole('button', { name: 'Lägg till i lunch' })).toBeDisabled()
    await user.clear(within(dialog).getByLabelText('Energi'))
    await user.type(within(dialog).getByLabelText('Energi'), '300,5')
    await user.click(within(dialog).getByLabelText('Mellanmål'))
    await user.click(within(dialog).getByRole('button', { name: 'Lägg till i mellanmål' }))

    const snack = await screen.findByRole('region', { name: 'Mellanmål' })
    expect(await within(snack).findByRole('button', { name: 'Snabbregistrering, 301 kcal' })).toBeInTheDocument()
  })

  it('avvisar kalorier utanför gränserna', async () => {
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kalorier' }))
    const dialog = screen.getByRole('dialog', { name: 'Snabbregistrering' })
    for (const value of ['0', '-5', 'abc', '10001']) {
      await user.clear(within(dialog).getByLabelText('Energi'))
      await user.type(within(dialog).getByLabelText('Energi'), value)
      expect(within(dialog).getByRole('button', { name: 'Lägg till i lunch' })).toBeDisabled()
    }
  })

  it('ändrar kalorier och namn på en snabbregistrering och tar bort den', async () => {
    await addEntry(db, {
      date: today,
      meal: 'dinner',
      foodId: 'quick:kcal',
      foodName: 'Snabbregistrering',
      grams: 650,
      per100g: { kcal: 100, protein: 0, carbs: 0, fat: 0 },
    })
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Snabbregistrering, 650 kcal' }))
    let dialog = screen.getByRole('dialog', { name: 'Snabbregistrering' })
    // Gram visas inte, bara kalorier
    expect(within(dialog).queryByLabelText('Mängd')).not.toBeInTheDocument()
    expect(within(dialog).getByLabelText('Energi')).toHaveValue('650')
    expect(within(dialog).getByLabelText('Namn (valfritt)')).toHaveValue('')
    await user.type(within(dialog).getByLabelText('Namn (valfritt)'), 'Gryta')
    await user.clear(within(dialog).getByLabelText('Energi'))
    await user.type(within(dialog).getByLabelText('Energi'), '700')
    await user.click(within(dialog).getByRole('button', { name: 'Spara' }))

    const dinner = screen.getByRole('region', { name: 'Middag' })
    await user.click(await within(dinner).findByRole('button', { name: 'Gryta, 700 kcal' }))
    dialog = screen.getByRole('dialog', { name: 'Gryta' })
    expect(within(dialog).getByLabelText('Namn (valfritt)')).toHaveValue('Gryta')
    await user.click(within(dialog).getByRole('button', { name: 'Ta bort' }))
    expect(await screen.findByText('2 000')).toBeInTheDocument()
    expect(await getEntriesForDate(db, today)).toEqual([])
  })

  it('visas inte bland senast loggade livsmedel', async () => {
    await addEntry(db, {
      date: today,
      meal: 'lunch',
      foodId: 'quick:kcal',
      foodName: 'Snabbregistrering',
      grams: 650,
      per100g: { kcal: 100, protein: 0, carbs: 0, fat: 0 },
    })
    window.location.hash = `#/lagg-till/${today}/lunch`
    render(<App db={db} />)

    await screen.findByRole('searchbox', { name: 'Sök livsmedel' })
    expect(screen.queryByRole('list', { name: 'Senast loggade' })).not.toBeInTheDocument()
  })
})

describe('kopiera en måltid', () => {
  async function seedLunches() {
    await addEntry(db, { date: yesterday, meal: 'lunch', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 80, per100g: oats }, new Date(`${yesterday}T12:00:00`))
    await addEntry(db, { date: yesterday, meal: 'lunch', foodId: 'slv:123', foodName: 'Mjölk fett 3% berikad', grams: 200, per100g: milk }, new Date(`${yesterday}T12:05:00`))
    await addEntry(db, { date: twoDaysAgo, meal: 'lunch', foodId: 'slv:123', foodName: 'Mjölk fett 3% berikad', grams: 100, per100g: milk }, new Date(`${twoDaysAgo}T12:00:00`))
    await addEntry(db, { date: yesterday, meal: 'breakfast', foodId: 'slv:702', foodName: 'Gröt', grams: 50, per100g: oats }, new Date(`${yesterday}T07:00:00`))
  }

  it('kopierar gårdagens måltid, som är förvald', async () => {
    await seedLunches()
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kopiera till lunch' }))
    const dialog = screen.getByRole('dialog', { name: 'Kopiera till lunch' })
    const days = await within(dialog).findByRole('list', { name: 'Tidigare dagar' })
    const yesterdayOption = within(days).getByRole('button', { name: /^Igår/ })
    expect(yesterdayOption).toHaveAttribute('aria-pressed', 'true')
    expect(yesterdayOption).toHaveTextContent('Havregryn fullkorn, Mjölk fett 3% berikad')
    expect(yesterdayOption).toHaveTextContent('420 kcal') // 300 + 120
    await user.click(await within(dialog).findByRole('button', { name: 'Kopiera 2 poster' }))

    const lunch = screen.getByRole('region', { name: 'Lunch' })
    expect(await within(lunch).findByRole('button', { name: 'Havregryn fullkorn, 80 g, 300 kcal' })).toBeInTheDocument()
    expect(within(lunch).getByRole('button', { name: 'Mjölk fett 3% berikad, 200 g, 120 kcal' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await getEntriesForDate(db, today)).toMatchObject([
      { meal: 'lunch', foodId: 'slv:702', grams: 80, per100g: oats },
      { meal: 'lunch', foodId: 'slv:123', grams: 200, per100g: milk },
    ])
    // Originalet är kvar
    expect(await getEntriesForDate(db, yesterday)).toHaveLength(3)
  })

  it('kopierar en annan dag när man väljer den', async () => {
    await seedLunches()
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kopiera till lunch' }))
    const dialog = screen.getByRole('dialog', { name: 'Kopiera till lunch' })
    const days = await within(dialog).findByRole('list', { name: 'Tidigare dagar' })
    const options = within(days).getAllByRole('button')
    expect(options).toHaveLength(2)
    await user.click(options[1]!)
    expect(options[1]).toHaveAttribute('aria-pressed', 'true')
    expect(options[0]).toHaveAttribute('aria-pressed', 'false')
    await user.click(await within(dialog).findByRole('button', { name: 'Kopiera 1 post' }))

    await within(screen.getByRole('region', { name: 'Lunch' })).findByRole('button', { name: 'Mjölk fett 3% berikad, 100 g, 60 kcal' })
    expect(await getEntriesForDate(db, today)).toHaveLength(1)
  })

  it('kan kopiera från en annan måltid till vald måltid', async () => {
    await seedLunches()
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kopiera till middag' }))
    const dialog = screen.getByRole('dialog', { name: 'Kopiera till middag' })
    expect(await within(dialog).findByText(/Inga loggade poster i middag/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Kopiera' })).toBeDisabled()

    await user.click(within(dialog).getByLabelText('Frukost'))
    await user.click(await within(dialog).findByRole('button', { name: 'Kopiera 1 post' }))

    const dinner = screen.getByRole('region', { name: 'Middag' })
    expect(await within(dinner).findByRole('button', { name: 'Gröt, 50 g, 188 kcal' })).toBeInTheDocument()
  })

  it('lägger kopian till det som redan är loggat i måltiden', async () => {
    await seedLunches()
    await addEntry(db, { date: today, meal: 'lunch', foodId: 'slv:123', foodName: 'Mjölk fett 3% berikad', grams: 250, per100g: milk })
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kopiera till lunch' }))
    await user.click(await within(screen.getByRole('dialog')).findByRole('button', { name: 'Kopiera 2 poster' }))

    await within(screen.getByRole('region', { name: 'Lunch' })).findByRole('button', { name: 'Havregryn fullkorn, 80 g, 300 kcal' })
    expect(await getEntriesForDate(db, today)).toHaveLength(3)
  })

  it('kopierar till den dag som visas, inte till idag', async () => {
    await seedLunches()
    window.location.hash = `#/dag/${yesterday}`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kopiera till lunch' }))
    const dialog = screen.getByRole('dialog', { name: 'Kopiera till lunch' })
    // Bara dagar före den visade dagen går att välja
    const days = await within(dialog).findByRole('list', { name: 'Tidigare dagar' })
    expect(within(days).getAllByRole('button')).toHaveLength(1)
    await user.click(await within(dialog).findByRole('button', { name: 'Kopiera 1 post' }))

    await vi.waitFor(async () => expect(await getEntriesForDate(db, yesterday)).toHaveLength(4))
    expect(await getEntriesForDate(db, today)).toEqual([])
  })

  it('visar ett fel och behåller panelen om kopieringen misslyckas', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await seedLunches()
    vi.spyOn(db.entries, 'bulkAdd').mockRejectedValueOnce(new Error('QuotaExceededError'))
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Kopiera till lunch' }))
    const dialog = screen.getByRole('dialog', { name: 'Kopiera till lunch' })
    await user.click(await within(dialog).findByRole('button', { name: 'Kopiera 2 poster' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Kunde inte kopiera måltiden. Försök igen.')
    expect(await getEntriesForDate(db, today)).toEqual([])
    consoleError.mockRestore()
  })
})

describe('favoriter', () => {
  it('lägger till och tar bort en favorit från mängdpanelen', async () => {
    window.location.hash = `#/lagg-till/${today}/frukost/slv%3A702`
    const user = userEvent.setup()
    render(<App db={db} />)

    const dialog = await screen.findByRole('dialog', { name: 'Havregryn fullkorn' })
    const star = within(dialog).getByRole('button', { name: 'Markera som favorit' })
    expect(star).toHaveAttribute('aria-pressed', 'false')
    // Stjärnan är avstängd medan favoriterna laddas och medan en ändring sparas
    await vi.waitFor(() => expect(star).toBeEnabled())
    await user.click(star)
    const active = await within(dialog).findByRole('button', { name: 'Ta bort som favorit' })
    expect(active).toHaveAttribute('aria-pressed', 'true')
    expect(await getFavoriteIds(db)).toEqual(['slv:702'])

    await vi.waitFor(() => expect(active).toBeEnabled())
    await user.click(active)
    expect(await within(dialog).findByRole('button', { name: 'Markera som favorit' })).toBeInTheDocument()
    expect(await getFavoriteIds(db)).toEqual([])
  })

  it('visar favoriterna under en egen flik och loggar från dem', async () => {
    await saveFavoriteIds(db, ['slv:123', 'slv:702'])
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('radio', { name: 'Favoriter' }))
    const favorites = await screen.findByRole('list', { name: 'Favoriter' })
    expect(within(favorites).getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringContaining('Mjölk fett 3% berikad'),
      expect.stringContaining('Havregryn fullkorn'),
    ])
    await user.click(within(favorites).getByRole('button', { name: /Havregryn fullkorn/ }))
    const dialog = screen.getByRole('dialog', { name: 'Havregryn fullkorn' })
    expect(await within(dialog).findByRole('button', { name: 'Ta bort som favorit' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))

    await screen.findByRole('heading', { name: 'Idag' })
    expect(await getEntriesForDate(db, today)).toMatchObject([{ foodId: 'slv:702', meal: 'lunch' }])
  })

  it('visar senast loggade som förval, även de som är favoriter', async () => {
    await addEntry(db, { date: yesterday, meal: 'lunch', foodId: 'slv:702', foodName: 'Havregryn fullkorn', grams: 80, per100g: oats })
    await addEntry(db, { date: yesterday, meal: 'lunch', foodId: 'slv:123', foodName: 'Mjölk fett 3% berikad', grams: 200, per100g: milk })
    await saveFavoriteIds(db, ['slv:702'])
    window.location.hash = `#/lagg-till/${today}/lunch`
    render(<App db={db} />)

    const recent = await screen.findByRole('list', { name: 'Senast loggade' })
    expect(within(recent).getAllByRole('button')).toHaveLength(2)
    expect(screen.getByRole('radio', { name: 'Senaste' })).toBeChecked()
    expect(screen.queryByRole('list', { name: 'Favoriter' })).not.toBeInTheDocument()
  })

  it('behåller vald flik när man har sökt och rensat sökfältet', async () => {
    await saveFavoriteIds(db, ['slv:702'])
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('radio', { name: 'Favoriter' }))
    const search = screen.getByRole('searchbox', { name: 'Sök livsmedel' })
    await user.type(search, 'mjölk')
    expect(screen.queryByRole('radio', { name: 'Favoriter' })).not.toBeInTheDocument()
    await user.clear(search)
    expect(await screen.findByRole('list', { name: 'Favoriter' })).toBeInTheDocument()
  })

  it('hoppar över en favorit som inte finns längre', async () => {
    await saveFavoriteIds(db, ['custom:borttagen', 'slv:702'])
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('radio', { name: 'Favoriter' }))
    const favorites = await screen.findByRole('list', { name: 'Favoriter' })
    expect(within(favorites).getAllByRole('button')).toHaveLength(1)
  })

  it('förklarar hur man får favoriter när det inte finns några', async () => {
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('radio', { name: 'Favoriter' }))
    expect(await screen.findByText(/Inga favoriter än/)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Favoriter' })).not.toBeInTheDocument()
  })

  it('visar inte favoriter bland sökträffarna', async () => {
    await saveFavoriteIds(db, ['slv:702'])
    window.location.hash = `#/lagg-till/${today}/lunch`
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.type(await screen.findByRole('searchbox', { name: 'Sök livsmedel' }), 'mjölk')
    await screen.findByRole('list', { name: 'Sökträffar' })
    expect(screen.queryByRole('list', { name: 'Favoriter' })).not.toBeInTheDocument()
  })
})
