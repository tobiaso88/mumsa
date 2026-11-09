import { createExport, migrateExport, validateImport, type Migration } from '../../../src/domain/backup/exportFormat'
import { MAX_TEXT_LENGTH } from '../../../src/domain/foods/foodValidation'
import { makeEntry, makeFood, makeRecipe } from '../../helpers/testData'

const valid = createExport(
  {
    foods: [makeFood(), makeFood({ id: 'off:7310865004703', source: 'off', barcode: '7310865004703', servingGrams: 30 })],
    entries: [makeEntry()],
    goals: { kcal: 2000, split: { proteinPct: 25, carbsPct: 45, fatPct: 30 } },
    profile: { weightKg: 70, heightCm: 175, ageYears: 30, sex: 'female', activity: 'light' },
    weights: [{ date: '2026-10-20', kg: 70.4, createdAt: '2026-10-20T07:00:00.000Z' }],
    recipes: [makeRecipe()],
  },
  new Date('2026-10-23T10:00:00Z'),
)

describe('createExport', () => {
  it('sätter app, version och tidpunkt', () => {
    expect(valid).toMatchObject({ app: 'mumsa', version: 3, exportedAt: '2026-10-23T10:00:00.000Z' })
  })
})

describe('validateImport', () => {
  it('godkänner en export efter JSON-rundresa', () => {
    const result = validateImport(JSON.parse(JSON.stringify(valid)))
    expect(result).toEqual({ ok: true, data: valid, skippedFoods: 0 })
  })

  it('hoppar över livsmedel från Livsmedelsverket och räknar dem', () => {
    const slv = makeFood({ id: 'slv:702', source: 'slv' })
    const result = validateImport({ ...valid, foods: [...valid.foods, slv] })
    expect(result.ok && result.data.foods).toEqual(valid.foods)
    expect(result.ok && result.skippedFoods).toBe(1)
  })

  it('godkänner export utan mål och profil', () => {
    const result = validateImport({ ...valid, goals: null, profile: undefined })
    expect(result.ok && result.data.goals === null && result.data.profile === null).toBe(true)
  })

  it('godkänner mål med inriktning och målvikt', () => {
    const goals = { ...valid.goals, objective: { kind: 'lose', pace: 'slow' }, targetWeightKg: 65 }
    const result = validateImport({ ...valid, goals })
    expect(result.ok && result.data.goals).toEqual(goals)
  })

  it('uppgraderar en export från version 2 utan recept', () => {
    const { recipes: _, ...v2 } = { ...valid, version: 2 }
    const result = validateImport(v2)
    expect(result.ok && result.data).toEqual({ ...valid, recipes: [] })
  })

  it('uppgraderar en export från version 1 utan vägningar', () => {
    const { weights: _, ...v1 } = { ...valid, version: 1 }
    const result = validateImport(v1)
    expect(result.ok && result.data).toEqual({ ...valid, weights: [], recipes: [] })
  })

  it.each([
    ['annan app', { ...valid, app: 'annan' }, 'inte en export från Mumsa'],
    ['inget objekt', 'hej', 'inte en export från Mumsa'],
    ['nyare version', { ...valid, version: 4 }, 'nyare version av Mumsa'],
    ['okänd äldre version', { ...valid, version: 0 }, 'Exportversion 0'],
    ['version som inte är ett tal', { ...valid, version: 'ett' }, 'Exportversion ett'],
    ['saknad version', { ...valid, version: undefined }, 'Exportversion undefined'],
    ['saknade listor', { ...valid, foods: undefined }, 'saknar livsmedel'],
    ['ogiltigt livsmedel', { ...valid, foods: [makeFood(), { id: 'x' }] }, 'Livsmedel nummer 2'],
    ['negativ näring', { ...valid, foods: [makeFood({ per100g: { kcal: -1, protein: 0, carbs: 0, fat: 0 } })] }, 'Livsmedel nummer 1'],
    ['id som inte stämmer med källan', { ...valid, foods: [makeFood({ id: 'slv:1', source: 'custom' })] }, 'Livsmedel nummer 1'],
    ['okänd källa', { ...valid, foods: [{ ...makeFood(), source: 'annan' }] }, 'Livsmedel nummer 1'],
    ['dubblerade livsmedel', { ...valid, foods: [makeFood(), makeFood()] }, 'flera livsmedel med samma id'],
    ['dubblerade loggposter', { ...valid, entries: [makeEntry(), makeEntry()] }, 'flera loggposter med samma id'],
    ['okänt kön', { ...valid, profile: { ...valid.profile, sex: 'annat' } }, 'Profilen'],
    ['ogiltigt datum', { ...valid, entries: [makeEntry({ date: '2026-02-30' })] }, 'Loggpost nummer 1'],
    ['okänd måltid', { ...valid, entries: [{ ...makeEntry(), meal: 'brunch' }] }, 'Loggpost nummer 1'],
    ['noll gram', { ...valid, entries: [makeEntry({ grams: 0 })] }, 'Loggpost nummer 1'],
    ['fel makrosumma', { ...valid, goals: { kcal: 2000, split: { proteinPct: 50, carbsPct: 50, fatPct: 50 } } }, 'Målen'],
    ['orimlig profil', { ...valid, profile: { ...valid.profile, ageYears: 5 } }, 'Profilen'],
    ['för hög energi', { ...valid, foods: [makeFood({ per100g: { kcal: 1e300, protein: 0, carbs: 0, fat: 0 } })] }, 'Livsmedel nummer 1'],
    ['makron över 100 g', { ...valid, foods: [makeFood({ per100g: { kcal: 400, protein: 60, carbs: 60, fat: 0 } })] }, 'Livsmedel nummer 1'],
    ['för långt namn', { ...valid, foods: [makeFood({ name: 'a'.repeat(MAX_TEXT_LENGTH + 1) })] }, 'Livsmedel nummer 1'],
    ['tomt namn', { ...valid, foods: [makeFood({ name: '  ' })] }, 'Livsmedel nummer 1'],
    ['ogiltig streckkod', { ...valid, foods: [makeFood({ barcode: '12ab' })] }, 'Livsmedel nummer 1'],
    ['för stor portion', { ...valid, foods: [makeFood({ servingGrams: 1e9 })] }, 'Livsmedel nummer 1'],
    ['ogiltig tidpunkt för livsmedel', { ...valid, foods: [makeFood({ updatedAt: 'igår' })] }, 'Livsmedel nummer 1'],
    ['för många gram', { ...valid, entries: [makeEntry({ grams: 1e9 })] }, 'Loggpost nummer 1'],
    ['orimlig näring i loggpost', { ...valid, entries: [makeEntry({ per100g: { kcal: 5000, protein: 0, carbs: 0, fat: 0 } })] }, 'Loggpost nummer 1'],
    ['tomt id för loggpost', { ...valid, entries: [makeEntry({ id: '' })] }, 'Loggpost nummer 1'],
    ['ogiltig tidpunkt för loggpost', { ...valid, entries: [makeEntry({ createdAt: 'nyss' })] }, 'Loggpost nummer 1'],
    ['okänd inriktning', { ...valid, goals: { ...valid.goals, objective: { kind: 'bulk' } } }, 'Målen'],
    ['orimlig målvikt', { ...valid, goals: { ...valid.goals, targetWeightKg: 0 } }, 'Målen'],
    ['saknade vägningar', { ...valid, weights: undefined }, 'saknar vägningar'],
    ['orimlig vikt', { ...valid, weights: [{ ...valid.weights[0], kg: 900 }] }, 'Vägning nummer 1'],
    ['ogiltigt datum för vägning', { ...valid, weights: [{ ...valid.weights[0], date: 'idag' }] }, 'Vägning nummer 1'],
    ['dubblerade vägningar', { ...valid, weights: [valid.weights[0], valid.weights[0]] }, 'samma dag'],
    ['orimligt kalorimål', { ...valid, goals: { ...valid.goals, kcal: 1e9 } }, 'Målen'],
    ['livsmedel med källan recept', { ...valid, foods: [makeFood({ id: 'recipe:x', source: 'recipe' })] }, 'Livsmedel nummer 1'],
    ['saknade recept', { ...valid, recipes: undefined }, 'saknar recept'],
    ['recept utan ingredienser', { ...valid, recipes: [makeRecipe({ ingredients: [] })] }, 'Recept nummer 1'],
    ['recept med id utan prefix', { ...valid, recipes: [makeRecipe({ id: 'custom:x' })] }, 'Recept nummer 1'],
    ['recept med noll portioner', { ...valid, recipes: [makeRecipe({ servings: 0 })] }, 'Recept nummer 1'],
    ['recept med för många portioner', { ...valid, recipes: [makeRecipe({ servings: 1000 })] }, 'Recept nummer 1'],
    ['recept med tomt namn', { ...valid, recipes: [makeRecipe({ name: ' ' })] }, 'Recept nummer 1'],
    [
      'recept med ogiltig mängd',
      { ...valid, recipes: [makeRecipe({ ingredients: [{ ...makeRecipe().ingredients[0]!, grams: -5 }] })] },
      'Recept nummer 1',
    ],
    [
      'recept med orimlig näring',
      { ...valid, recipes: [makeRecipe({ ingredients: [{ ...makeRecipe().ingredients[0]!, per100g: { kcal: 5000, protein: 0, carbs: 0, fat: 0 } }] })] },
      'Recept nummer 1',
    ],
    ['dubblerade recept', { ...valid, recipes: [makeRecipe(), makeRecipe()] }, 'flera recept med samma id'],
  ])('avvisar %s', (_, input, message) => {
    const result = validateImport(input)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(message)
  })
})

describe('migrateExport', () => {
  const addField: Migration = (json) => ({ ...json, steps: [...((json.steps as string[] | undefined) ?? []), `från ${String(json.version)}`] })

  it('lämnar en export med aktuell version orörd', () => {
    expect(migrateExport({ version: 3, a: 1 })).toEqual({ version: 3, a: 1 })
  })

  it('kör stegen i ordning tills målversionen nås', () => {
    expect(migrateExport({ version: 1 }, { 1: addField, 2: addField }, 3)).toEqual({ version: 3, steps: ['från 1', 'från 2'] })
  })

  it('ger null när ett steg saknas eller versionen är ogiltig', () => {
    expect(migrateExport({ version: 1 }, { 2: addField }, 3)).toBeNull()
    expect(migrateExport({ version: 4 }, { 1: addField }, 3)).toBeNull()
    expect(migrateExport({ version: '1' }, { 1: addField }, 3)).toBeNull()
    expect(migrateExport({}, { 1: addField }, 3)).toBeNull()
  })
})
