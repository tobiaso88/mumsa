import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../../../src/data/db/db'
import { getEntriesForDate } from '../../../src/data/repos/entriesRepo'
import { createRecipe, listRecipes } from '../../../src/data/repos/recipesRepo'
import { saveGoals } from '../../../src/data/repos/settingsRepo'
import { makeRecipe } from '../../helpers/testData'
import { createTestDb } from '../../helpers/testDb'
import { App } from '../../../src/ui/App'

vi.mock('../../../src/data/sources/livsmedelsverket.json', () => ({
  default: {
    source: 'Livsmedelsverkets livsmedelsdatabas',
    license: 'CC BY 4.0',
    retrieved: '2026-10-23',
    rows: [
      [1, 'Mjölk fett 3%', 60, 3.4, 4.8, 3],
      [2, 'Havregryn', 370, 13, 59, 7],
    ],
  },
}))

let db: MumsaDb
const date = '2026-10-20'
const { id: _id, updatedAt: _updatedAt, ...recipeInput } = makeRecipe()

beforeEach(async () => {
  db = createTestDb()
  await saveGoals(db, { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } })
  window.location.hash = `#/lagg-till/${date}/lunch`
})
afterEach(async () => {
  // Avmontera innan databasen tas bort så att inga frågor körs mot en stängd databas
  cleanup()
  vi.restoreAllMocks()
  await db.delete()
})

async function fill(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const input = await screen.findByLabelText(label)
  await user.clear(input)
  await user.type(input, value)
}

async function addIngredient(user: ReturnType<typeof userEvent.setup>, search: string, name: RegExp, grams: string) {
  await user.click(screen.getByRole('button', { name: 'Lägg till ingrediens' }))
  const picker = await screen.findByRole('dialog', { name: 'Lägg till ingrediens' })
  await user.type(within(picker).getByRole('searchbox', { name: 'Sök ingrediens' }), search)
  await user.click(await within(picker).findByRole('button', { name }))
  const amount = await within(screen.getByRole('dialog')).findByLabelText('Mängd')
  await user.clear(amount)
  await user.type(amount, grams)
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Lägg till ingrediens' }))
}

it('skapar ett recept av ingredienser och loggar en portion av det', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await user.click(await screen.findByRole('radio', { name: 'Recept' }))
  await user.click(screen.getByRole('link', { name: 'Nytt recept' }))

  const save = await screen.findByRole('button', { name: 'Spara recept' })
  expect(save).toBeDisabled()
  await fill(user, 'Namn', 'Havregrynsgröt')
  await fill(user, 'Antal portioner', '2')
  await addIngredient(user, 'havre', /^Havregryn/, '100')
  await addIngredient(user, 'mjölk', /Mjölk/, '300')

  // 100 g havregryn och 300 g mjölk ger 550 kcal, alltså 275 per portion
  expect(screen.getByLabelText('Havregryn')).toHaveValue('100')
  expect(screen.getByLabelText('Mjölk fett 3%')).toHaveValue('300')
  const summary = screen.getByRole('group', { name: 'Näring per portion' })
  expect(within(summary).getByLabelText('Näring per portion')).toHaveTextContent('275')
  expect(summary).toHaveTextContent('Totalt 400 g, vilket blir 200 g per portion')
  await user.click(save)

  // Receptet öppnas som ett livsmedel med en portion som förval
  const dialog = await screen.findByRole('dialog', { name: 'Havregrynsgröt' })
  expect(dialog).toHaveTextContent('Recept · 275 kcal per portion')
  expect(within(dialog).getByLabelText('Mängd')).toHaveValue('1')
  expect(within(dialog).getByText('Motsvarar 200 g.')).toBeInTheDocument()
  expect(within(dialog).getByLabelText('Näring för vald mängd')).toHaveTextContent('275')
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))

  await screen.findByRole('heading', { name: /20 oktober/ })
  const [recipe] = await listRecipes(db)
  expect(recipe).toMatchObject({ name: 'Havregrynsgröt', servings: 2, ingredients: [{ grams: 100 }, { grams: 300 }] })
  expect(await getEntriesForDate(db, date)).toMatchObject([{ foodId: recipe!.id, foodName: 'Havregrynsgröt', grams: 200, meal: 'lunch' }])
})

it('loggar en halv portion', async () => {
  const recipe = await createRecipe(db, recipeInput)
  window.location.hash = `#/lagg-till/${date}/lunch/${encodeURIComponent(recipe.id)}`
  const user = userEvent.setup()
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Havregrynsgröt' })
  await user.click(within(dialog).getByRole('button', { name: 'Minska' }))
  expect(within(dialog).getByLabelText('Mängd')).toHaveValue('0,5')
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))

  await screen.findByRole('heading', { name: /20 oktober/ })
  expect(await getEntriesForDate(db, date)).toMatchObject([{ foodId: recipe.id, grams: 100 }])
})

it('visar recepten under en egen flik och hittar dem med sökning', async () => {
  await createRecipe(db, recipeInput)
  const user = userEvent.setup()
  render(<App db={db} />)

  await screen.findByRole('searchbox', { name: 'Sök livsmedel' })
  expect(screen.queryByRole('list', { name: 'Mina recept' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('radio', { name: 'Recept' }))
  const list = await screen.findByRole('list', { name: 'Mina recept' })
  expect(within(list).getByRole('button', { name: /Havregrynsgröt/ })).toHaveTextContent('275 kcal/portion')

  await user.type(screen.getByRole('searchbox', { name: 'Sök livsmedel' }), 'gröt')
  expect(screen.queryByRole('list', { name: 'Mina recept' })).not.toBeInTheDocument()
  expect(await screen.findByRole('button', { name: /Havregrynsgröt/ })).toBeInTheDocument()
})

it('ändrar ingredienserna i ett recept och sparar om det', async () => {
  const recipe = await createRecipe(db, recipeInput)
  window.location.hash = `#/recept/andra/${date}/lunch/${encodeURIComponent(recipe.id)}`
  const user = userEvent.setup()
  render(<App db={db} />)

  await fill(user, 'Mjölk fett 3%', '500')
  await user.click(screen.getByRole('button', { name: 'Ta bort Havregryn' }))
  await fill(user, 'Antal portioner', '1,5')
  await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

  await screen.findByRole('dialog', { name: 'Havregrynsgröt' })
  expect(await listRecipes(db)).toMatchObject([
    { id: recipe.id, servings: 1.5, ingredients: [{ foodName: 'Mjölk fett 3%', grams: 500 }] },
  ])
})

it('tar bort ett recept utan att röra det som redan är loggat', async () => {
  const recipe = await createRecipe(db, recipeInput)
  window.location.hash = `#/lagg-till/${date}/lunch/${encodeURIComponent(recipe.id)}`
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const user = userEvent.setup()
  render(<App db={db} />)

  const dialog = await screen.findByRole('dialog', { name: 'Havregrynsgröt' })
  await user.click(within(dialog).getByRole('button', { name: 'Lägg till i lunch' }))
  await screen.findByRole('heading', { name: /20 oktober/ })

  window.location.hash = `#/recept/andra/${date}/lunch/${encodeURIComponent(recipe.id)}`
  await user.click(await screen.findByRole('button', { name: 'Ta bort receptet' }))
  await screen.findByRole('heading', { name: 'Lägg till i lunch' })
  expect(await listRecipes(db)).toEqual([])
  expect(await getEntriesForDate(db, date)).toHaveLength(1)
})

it('säger till när receptet inte finns', async () => {
  window.location.hash = `#/recept/andra/${date}/lunch/recipe%3Asaknas`
  render(<App db={db} />)
  expect(await screen.findByText('Receptet finns inte.')).toBeInTheDocument()
})

it('kräver ingredienser och giltiga mängder innan receptet går att spara', async () => {
  window.location.hash = `#/recept/ny/${date}/lunch`
  const user = userEvent.setup()
  render(<App db={db} />)

  await fill(user, 'Namn', 'Soppa')
  expect(screen.getByRole('button', { name: 'Spara recept' })).toBeDisabled()
  expect(screen.getByText('Lägg till minst en ingrediens.')).toBeInTheDocument()

  await addIngredient(user, 'havre', /^Havregryn/, '100')
  expect(screen.getByRole('button', { name: 'Spara recept' })).toBeEnabled()

  await fill(user, 'Havregryn', '0')
  expect(screen.getByRole('button', { name: 'Spara recept' })).toBeDisabled()
  await fill(user, 'Havregryn', '80')
  await fill(user, 'Antal portioner', '0')
  expect(screen.getByRole('button', { name: 'Spara recept' })).toBeDisabled()
})

describe('receptlistan', () => {
  it('nås från profilen och visar recepten med näring per portion', async () => {
    await createRecipe(db, recipeInput)
    await createRecipe(db, { ...recipeInput, name: 'Äppelpaj', servings: 1 })
    window.location.hash = '#/profil'
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('link', { name: /Mina recept/ }))
    expect(await screen.findByRole('heading', { name: 'Recept' })).toBeInTheDocument()
    const list = screen.getByRole('region', { name: 'Mina recept' })
    const rows = within(list).getAllByRole('link')
    expect(rows.map((r) => r.textContent)).toEqual(['Havregrynsgröt275 kcal · 2 portioner', 'Äppelpaj550 kcal · 1 portion'])
  })

  it('visar ett tomt läge med länk till att skapa ett recept', async () => {
    window.location.hash = '#/recept'
    render(<App db={db} />)
    expect(await screen.findByText(/Du har inga recept än/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nytt recept' })).toHaveAttribute('href', '#/recept/ny')
  })

  it('öppnar ett recept för ändring utan att logga något och går tillbaka till listan', async () => {
    const recipe = await createRecipe(db, recipeInput)
    window.location.hash = '#/recept'
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('link', { name: /Havregrynsgröt/ }))
    await fill(user, 'Namn', 'Gröt')
    await user.click(screen.getByRole('button', { name: 'Spara ändringar' }))

    await screen.findByRole('heading', { name: 'Recept' })
    expect(window.location.hash).toBe('#/recept')
    expect(await listRecipes(db)).toMatchObject([{ id: recipe.id, name: 'Gröt' }])
    expect(await getEntriesForDate(db, date)).toEqual([])
  })

  it('sparar ändringar och loggar receptet i dagens måltid', async () => {
    const recipe = await createRecipe(db, recipeInput)
    window.location.hash = `#/recept/andra/${encodeURIComponent(recipe.id)}`
    const user = userEvent.setup()
    render(<App db={db} />)

    await fill(user, 'Antal portioner', '4')
    await user.click(screen.getByRole('button', { name: 'Logga i dagboken' }))

    // Mängdpanelen öppnas för idag med den ändrade portionen förvald
    const dialog = await screen.findByRole('dialog', { name: 'Havregrynsgröt' })
    expect(within(dialog).getByText('Motsvarar 100 g.')).toBeInTheDocument()
    expect(window.location.hash).toMatch(/^#\/lagg-till\/\d{4}-\d{2}-\d{2}\/[a-z]+\/recipe/)
    expect(await listRecipes(db)).toMatchObject([{ id: recipe.id, servings: 4 }])
  })

  it('visar inte loggknappen när receptet öppnats från lägg till-flödet', async () => {
    const recipe = await createRecipe(db, recipeInput)
    window.location.hash = `#/recept/andra/${date}/lunch/${encodeURIComponent(recipe.id)}`
    render(<App db={db} />)

    await screen.findByRole('button', { name: 'Spara ändringar' })
    expect(screen.queryByRole('button', { name: 'Logga i dagboken' })).not.toBeInTheDocument()
  })

  it('skapar ett nytt recept från listan och avbryter tillbaka till den', async () => {
    window.location.hash = '#/recept'
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('link', { name: 'Nytt recept' }))
    expect(await screen.findByRole('link', { name: 'Avbryt' })).toHaveAttribute('href', '#/recept')
    await user.click(screen.getByRole('link', { name: 'Avbryt' }))
    await screen.findByRole('heading', { name: 'Recept' })
  })

  it('tar bort ett recept och hamnar i listan', async () => {
    const recipe = await createRecipe(db, recipeInput)
    window.location.hash = `#/recept/andra/${encodeURIComponent(recipe.id)}`
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    render(<App db={db} />)

    await user.click(await screen.findByRole('button', { name: 'Ta bort receptet' }))
    expect(await screen.findByText(/Du har inga recept än/)).toBeInTheDocument()
    expect(await listRecipes(db)).toEqual([])
  })
})
