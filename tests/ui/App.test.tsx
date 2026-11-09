import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { MumsaDb } from '../../src/data/db/db'
import { getGoals, getProfile, saveGoals } from '../../src/data/repos/settingsRepo'
import { createTestDb } from '../helpers/testDb'
import { App } from '../../src/ui/App'

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

/** Går förbi välkomstskärmen till målformuläret. */
async function start(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Kom igång' }))
  await screen.findByRole('heading', { name: 'Ditt mål' })
}

it('visar introduktionen när inget mål är satt och dagsvyn efter att målet sparats', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  expect(await screen.findByRole('heading', { name: 'Välkommen till Mumsa' })).toBeInTheDocument()
  await start(user)

  await user.click(screen.getByLabelText('Ange själv'))
  await user.type(screen.getByLabelText('Kalorimål per dag'), '1900')
  await user.click(screen.getByRole('button', { name: 'Kom igång' }))

  expect(await screen.findByText('0 av 1 900 kcal')).toBeInTheDocument()
  expect(screen.getByRole('navigation', { name: 'Huvudmeny' })).toBeInTheDocument()
  expect(await getGoals(db)).toEqual({ kcal: 1900, split: goals.split, objective: { kind: 'maintain' } })
})

it('räknar ut mål från profilen och sparar profilen', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await start(user)

  const submit = screen.getByRole('button', { name: 'Kom igång' })
  expect(submit).toBeDisabled()
  await user.type(screen.getByLabelText('Vikt'), '70')
  await user.type(screen.getByLabelText('Längd'), '175')
  await user.type(screen.getByLabelText('Ålder'), '30')
  await user.click(screen.getByLabelText('Man'))
  await user.selectOptions(screen.getByLabelText('Aktivitetsnivå'), 'moderate')

  // 1648,75 × 1,55 ≈ 2556
  expect(screen.getByText('2 556 kcal')).toBeInTheDocument()
  expect(screen.getByText(/ingen rekommendation eller medicinsk bedömning/)).toBeInTheDocument()
  await user.click(submit)

  expect(await screen.findByText('0 av 2 556 kcal')).toBeInTheDocument()
  expect(await getProfile(db)).toEqual({ weightKg: 70, heightCm: 175, ageYears: 30, sex: 'male', activity: 'moderate' })
})

it('justerar det uträknade målet efter vald inriktning och takt', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await start(user)

  await user.selectOptions(screen.getByLabelText('Vad vill du uppnå?'), 'lose')
  await user.click(screen.getByLabelText('Måttlig'))
  await user.type(screen.getByLabelText('Målvikt (frivillig)'), '65')
  // Fördelningen fylls i som utgångspunkt för målet
  expect(screen.getByLabelText('Protein')).toHaveValue('30')
  await user.type(screen.getByLabelText('Vikt'), '70')
  await user.type(screen.getByLabelText('Längd'), '175')
  await user.type(screen.getByLabelText('Ålder'), '30')
  await user.click(screen.getByLabelText('Man'))
  await user.selectOptions(screen.getByLabelText('Aktivitetsnivå'), 'moderate')

  // 2556 − 550 kcal per dag för ungefär 0,5 kg per vecka
  expect(screen.getByText('2 556 kcal')).toBeInTheDocument()
  expect(screen.getByText('2 006 kcal')).toBeInTheDocument()
  expect(screen.getByText(/−550 kcal per dag/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Kom igång' }))

  expect(await screen.findByText('0 av 2 006 kcal')).toBeInTheDocument()
  expect(await getGoals(db)).toEqual({
    kcal: 2006,
    split: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
    objective: { kind: 'lose', pace: 'moderate' },
    targetWeightKg: 65,
  })
})

it('upplyser om att målet ligger under basalomsättningen', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await start(user)
  await user.selectOptions(screen.getByLabelText('Vad vill du uppnå?'), 'lose')
  await user.click(screen.getByLabelText('Måttlig'))
  await user.type(screen.getByLabelText('Vikt'), '50')
  await user.type(screen.getByLabelText('Längd'), '160')
  await user.type(screen.getByLabelText('Ålder'), '60')
  await user.click(screen.getByLabelText('Kvinna'))
  await user.selectOptions(screen.getByLabelText('Aktivitetsnivå'), 'sedentary')

  expect(screen.getByText(/under din uppskattade basalomsättning/)).toBeInTheDocument()
})

it('avvisar en orimlig målvikt', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await start(user)
  await user.selectOptions(screen.getByLabelText('Vad vill du uppnå?'), 'gain')
  await user.click(screen.getByLabelText('Ange själv'))
  await user.type(screen.getByLabelText('Kalorimål per dag'), '2500')
  await user.type(screen.getByLabelText('Målvikt (frivillig)'), '0')

  expect(screen.getByRole('alert')).toHaveTextContent('Ange målvikten i kilo')
  expect(screen.getByRole('button', { name: 'Kom igång' })).toBeDisabled()
})

it('kräver att makrofördelningen blir 100 %', async () => {
  const user = userEvent.setup()
  render(<App db={db} />)
  await start(user)
  await user.click(screen.getByLabelText('Ange själv'))
  await user.type(screen.getByLabelText('Kalorimål per dag'), '2000')
  const protein = screen.getByLabelText('Protein')
  await user.clear(protein)
  await user.type(protein, '40')

  expect(screen.getByRole('alert')).toHaveTextContent('nu blir de 115 %')
  expect(screen.getByRole('button', { name: 'Kom igång' })).toBeDisabled()
})

it('visar ett felmeddelande i stället för en tom skärm när datan inte går att läsa', async () => {
  // React och ErrorBoundary loggar felet, vilket är väntat här
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(db.settings, 'get').mockRejectedValue(new Error('UnknownError'))
  render(<App db={db} />)

  expect(await screen.findByRole('heading', { name: 'Något gick fel' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Ladda om' })).toBeInTheDocument()
  consoleError.mockRestore()
})

it('visar ett fel och behåller formuläret om målet inte går att spara', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(db.settings, 'put').mockRejectedValueOnce(new Error('QuotaExceededError'))
  const user = userEvent.setup()
  render(<App db={db} />)

  await start(user)
  await user.click(screen.getByLabelText('Ange själv'))
  await user.type(screen.getByLabelText('Kalorimål per dag'), '1900')
  await user.click(screen.getByRole('button', { name: 'Kom igång' }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Målet kunde inte sparas. Försök igen.')
  expect(screen.getByRole('heading', { name: 'Ditt mål' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Kom igång' })).toBeEnabled()
  expect(await getGoals(db)).toBeNull()
  consoleError.mockRestore()
})

it('låter användaren ändra målet på profilsidan', async () => {
  await saveGoals(db, goals)
  window.location.hash = '#/profil'
  const user = userEvent.setup()
  render(<App db={db} />)

  const goalCard = await screen.findByRole('region', { name: 'Ditt dagliga mål' })
  expect(goalCard).toHaveTextContent('2 000 kcal')
  expect(goalCard).toHaveTextContent('25 % · 125 g')
  await user.click(screen.getByRole('button', { name: /^Kalorimål/ }))

  const sheet = screen.getByRole('dialog', { name: 'Kalorimål' })
  const kcal = within(sheet).getByLabelText('Kalorimål per dag')
  expect(kcal).toHaveValue('2000')
  await user.clear(kcal)
  await user.type(kcal, '1800')
  expect(within(sheet).getByRole('status')).toHaveTextContent('Dagligt mål blir 1 800 kcal')
  await user.click(within(sheet).getByRole('button', { name: 'Spara' }))

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(await screen.findByText('1 800')).toBeInTheDocument()
  expect((await getGoals(db))?.kcal).toBe(1800)
})

it('ändrar bara den inställning som trycks på och räknar om målet', async () => {
  // 10 × 80 + 6,25 × 181 − 5 × 38 + 5 = 1746,25; × 1,55 − 550 ≈ 2157
  await saveGoals(db, { ...goals, kcal: 2157, objective: { kind: 'lose', pace: 'moderate' } })
  await db.settings.put({ key: 'profile', value: { weightKg: 80, heightCm: 181, ageYears: 38, sex: 'male', activity: 'moderate' } })
  window.location.hash = '#/profil'
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.click(await screen.findByRole('button', { name: /^Ålder/ }))
  const sheet = screen.getByRole('dialog', { name: 'Ålder' })
  // Bara åldern visas, inte hela formuläret
  expect(within(sheet).queryByLabelText('Längd')).not.toBeInTheDocument()
  const age = within(sheet).getByLabelText('Ålder')
  await user.clear(age)
  await user.type(age, '40')
  expect(within(sheet).getByRole('status')).toHaveTextContent('Dagligt mål blir 2 141 kcal')
  await user.click(within(sheet).getByRole('button', { name: 'Spara' }))

  await waitFor(async () => expect((await getProfile(db))?.ageYears).toBe(40))
  expect((await getGoals(db))?.kcal).toBe(2141)
  expect(await screen.findByRole('region', { name: 'Om dig' })).toHaveTextContent('40 år')
})

it('byter inriktning från en lista och behåller ett eget kalorimål', async () => {
  await saveGoals(db, goals)
  window.location.hash = '#/profil'
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.click(await screen.findByRole('button', { name: /^Vad vill du uppnå\?/ }))
  const sheet = screen.getByRole('dialog', { name: 'Vad vill du uppnå?' })
  await user.click(within(sheet).getByLabelText('Gå ner i vikt'))
  await user.click(within(sheet).getByRole('button', { name: 'Spara' }))

  await waitFor(async () => expect((await getGoals(db))?.objective).toEqual({ kind: 'lose', pace: 'slow' }))
  expect((await getGoals(db))?.kcal).toBe(2000)
  expect(await screen.findByRole('button', { name: /^Takt/ })).toBeInTheDocument()
})

it('erbjuder att använda senaste vägningen i profilen', async () => {
  await saveGoals(db, goals)
  await db.settings.put({ key: 'profile', value: { weightKg: 80, heightCm: 175, ageYears: 30, sex: 'male', activity: 'light' } })
  await db.weights.put({ date: '2026-10-20', kg: 78.4, createdAt: '2026-10-20T07:00:00.000Z' })
  window.location.hash = '#/profil'
  const user = userEvent.setup()
  render(<App db={db} />)

  await user.click(await screen.findByRole('button', { name: /^Vikt/ }))
  const sheet = screen.getByRole('dialog', { name: 'Vikt' })
  // Vägningarna läses in efter att arket har öppnats
  await user.click(await within(sheet).findByRole('button', { name: 'Använd senaste vägningen (78,4 kg)' }))
  expect(within(sheet).getByLabelText('Vikt')).toHaveValue('78,4')
  expect(within(sheet).queryByRole('button', { name: /Använd senaste vägningen/ })).not.toBeInTheDocument()
  await user.click(within(sheet).getByRole('button', { name: 'Spara' }))

  // Målet är angivet själv, så bara profilen ändras
  await waitFor(async () => expect((await getProfile(db))?.weightKg).toBe(78.4))
  expect((await getGoals(db))?.kcal).toBe(2000)
})

it('sammanfattar mål och profil på profilsidan', async () => {
  await saveGoals(db, { ...goals, kcal: 2157, objective: { kind: 'lose', pace: 'moderate' }, targetWeightKg: 76 })
  await db.settings.put({ key: 'profile', value: { weightKg: 80, heightCm: 181, ageYears: 38, sex: 'male', activity: 'moderate' } })
  window.location.hash = '#/profil'
  const user = userEvent.setup()
  render(<App db={db} />)

  const goalRows = await screen.findByRole('region', { name: 'Ditt mål' })
  expect(goalRows).toHaveTextContent('Räkna ut åt mig')
  expect(goalRows).toHaveTextContent('Gå ner i vikt')
  expect(goalRows).toHaveTextContent('0,5 kg/vecka')
  expect(goalRows).toHaveTextContent('76 kg')
  const about = screen.getByRole('region', { name: 'Om dig' })
  expect(about).toHaveTextContent('Man')
  expect(about).toHaveTextContent('38 år')
  expect(about).toHaveTextContent('181 cm')
  expect(about).toHaveTextContent('Måttlig')
  await user.click(screen.getByRole('button', { name: /^Aktivitetsnivå/ }))
  expect(within(screen.getByRole('dialog', { name: 'Aktivitetsnivå' })).getByLabelText(/Måttligt aktiv/)).toBeChecked()
})
