/**
 * Skapar en demofil med påhittad men trovärdig dagbok att importera i appen,
 * för att få statistik att titta på och för att testa prestanda med mycket data.
 *
 *   npm run data:demo
 *   npm run data:demo -- --years 10 --end 2026-12-31 --seed 7 --out demo/stor.json
 *   npm run data:demo -- --end 2026-11-11 --morning
 *
 * Med --morning är sista dagen påbörjad: bara frukosten är loggad, så att
 * resten av dagen kan loggas under en demo.
 *
 * Personen och allt den äter är påhittat. Vikten följer en enkel
 * energibalans: loggat intag plus det som glöms bort, mot en förbrukning som
 * sjunker när vikten går ner. Resultatet blir platåer, semesteruppehåll,
 * fredagsmys och högtider i stället för en jämn kurva.
 *
 * Utdata följer exportformatet i src/domain/backup/exportFormat.ts (version 4).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'
import {
  BREAKFASTS,
  DINNERS,
  EXTRA_FOODS,
  FEASTS,
  LUNCHES,
  RECIPES,
  SNACKS,
  TREATS,
  type DayContext,
  type Feast,
  type Nutrients,
  type Portion,
  type Template,
} from './demo/catalog.ts'

const EXPORT_VERSION = 4
const KCAL_PER_KG = 7700
type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'
/** Ungefärliga klockslag i minuter efter midnatt. Mellanmål kan vara förmiddag, eftermiddag eller kväll. */
const MEAL_MINUTES = { breakfast: 430, lunch: 720, dinner: 1095, snack: [600, 900, 1230] } as const

const PERSON = { heightCm: 181, sex: 'male', activity: 'light', activityFactor: 1.375, startKg: 94.5, ageAtEnd: 36 } as const

/** Mål under dagboken, i dagar från start. Samma takt som appens objectives.ts. */
const PHASES = [
  { from: 0, objective: { kind: 'lose', pace: 'moderate' }, kcalPerDay: -550, logRate: 0.97 },
  { from: 210, objective: { kind: 'maintain' }, kcalPerDay: 0, logRate: 0.7 },
  { from: 335, objective: { kind: 'lose', pace: 'slow' }, kcalPerDay: -275, logRate: 0.88 },
] as const
type Phase = (typeof PHASES)[number]
const TARGET_KG = 80

// --- Slump --------------------------------------------------------------

/** Mulberry32: snabb och tillräckligt bra, och samma frö ger samma fil. */
function makeRandom(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const normal = (mean: number, sd: number) => {
    const u = 1 - next()
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next())
  }
  const chance = (probability: number) => next() < probability
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  const uuid = () => {
    const hex = Array.from({ length: 32 }, () => Math.floor(next() * 16).toString(16))
    hex[12] = '4'
    hex[16] = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
    const s = hex.join('')
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
  }
  return { next, normal, chance, int, uuid }
}
type Random = ReturnType<typeof makeRandom>

function pickWeighted(rnd: Random, templates: readonly Template[], ctx: DayContext, usable: (t: Template) => boolean) {
  const options = templates
    .filter(usable)
    .map((t) => ({ t, w: t.weight * (t.when ? t.when(ctx) : 1) }))
    .filter((o) => o.w > 0)
  const total = options.reduce((sum, o) => sum + o.w, 0)
  let roll = rnd.next() * total
  for (const o of options) {
    roll -= o.w
    if (roll <= 0) return o.t
  }
  return options[options.length - 1]!.t
}

// --- Datum --------------------------------------------------------------

const DAY_MS = 86_400_000
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const parseIso = (iso: string) => Date.parse(`${iso}T00:00:00Z`)
const isoOf = (y: number, m: number, d: number) => toIso(Date.UTC(y, m - 1, d))

/** Påskdagen enligt den gregorianska algoritmen. */
function easterSunday(y: number): number {
  const a = y % 19
  const b = Math.floor(y / 100)
  const c = y % 100
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((b + 8) / 25) + 1) / 3) + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return Date.UTC(y, month - 1, day)
}

function feastDays(years: Iterable<number>): Map<string, string> {
  const days = new Map<string, string>()
  for (const y of years) {
    const easter = easterSunday(y)
    const midsummer = [19, 20, 21, 22, 23, 24, 25].find((d) => new Date(Date.UTC(y, 5, d)).getUTCDay() === 5)!
    days.set(isoOf(y, 12, 24), 'julafton')
    days.set(isoOf(y, 12, 25), 'juldagen')
    days.set(isoOf(y, 12, 31), 'nyarsafton')
    days.set(isoOf(y, 12, 13), 'lucia')
    days.set(isoOf(y, 10, 4), 'kanelbullensdag')
    days.set(isoOf(y, 3, 14), 'fodelsedag')
    days.set(isoOf(y, 6, midsummer), 'midsommarafton')
    days.set(toIso(easter - DAY_MS), 'paskafton')
    days.set(toIso(easter - 47 * DAY_MS), 'fettisdagen')
  }
  return days
}

/** Semester i juli utan loggning: längre första sommaren, sedan kortare. */
function vacationDays(years: number[]): Set<string> {
  const days = new Set<string>()
  years.forEach((y, i) => {
    const length = i === 0 ? 18 : 9
    const start = Date.UTC(y, 6, 6 + (i % 2) * 7)
    for (let d = 0; d < length; d++) days.add(toIso(start + d * DAY_MS))
  })
  return days
}

// --- Livsmedel ----------------------------------------------------------

type FoodRef = { id: string; name: string; per100g: Nutrients; since: number }
type SlvRow = [number, string, number, number, number, number]

/** Samma räkning som recipeToFood i appen: ingrediensernas näring delad på deras sammanlagda vikt. */
function recipePer100g(ingredients: readonly { grams: number; per100g: Nutrients }[]): Nutrients {
  const total = ingredients.reduce((sum, i) => sum + i.grams, 0)
  const per100g = (pick: (n: Nutrients) => number) =>
    (ingredients.reduce((sum, i) => sum + (pick(i.per100g) * i.grams) / 100, 0) * 100) / total
  return { kcal: per100g((n) => n.kcal), protein: per100g((n) => n.protein), carbs: per100g((n) => n.carbs), fat: per100g((n) => n.fat) }
}

async function loadFoods(rnd: Random, start: number) {
  const json = JSON.parse(
    await readFile(new URL('../src/data/sources/livsmedelsverket.json', import.meta.url), 'utf8'),
  ) as { rows: SlvRow[] }
  const refs = new Map<number | string, FoodRef>()
  for (const [nummer, name, kcal, protein, carbs, fat] of json.rows) {
    refs.set(nummer, { id: `slv:${nummer}`, name, per100g: { kcal, protein, carbs, fat }, since: 0 })
  }
  const foods = EXTRA_FOODS.map(({ key, since, ...food }) => {
    const id = food.source === 'off' ? `off:${food.barcode}` : `custom:${rnd.uuid()}`
    refs.set(key, { id, name: food.name, per100g: food.per100g, since })
    return { id, ...food, updatedAt: new Date(start + since * DAY_MS + 19 * 3_600_000).toISOString() }
  })
  const recipes = RECIPES.map(({ key, name, servings, since, ingredients: parts }) => {
    const ingredients = parts.map(({ food, grams }) => {
      const ref = refs.get(food)
      if (!ref) throw new Error(`Receptet ${name} använder ett livsmedel som saknas: ${food}`)
      return { foodId: ref.id, foodName: ref.name, grams, per100g: ref.per100g }
    })
    const id = `recipe:${rnd.uuid()}`
    refs.set(key, { id, name, per100g: recipePer100g(ingredients), since })
    return { id, name, servings, ingredients, updatedAt: new Date(start + since * DAY_MS + 19 * 3_600_000).toISOString() }
  })
  const all = [BREAKFASTS, LUNCHES, DINNERS, SNACKS, TREATS].flat().flatMap((t) => t.items)
  const missing = [...all, ...Object.values(FEASTS).flatMap((f) => Object.values(f).flat())]
    .map((portion) => portion.food)
    .filter((food) => !refs.has(food))
  if (missing.length > 0) throw new Error(`Saknade livsmedel i katalogen: ${[...new Set(missing)].join(', ')}`)
  return { refs, foods, recipes }
}

// --- Dagboken -----------------------------------------------------------

type Entry = {
  id: string
  date: string
  meal: Meal
  foodId: string
  foodName: string
  grams: number
  per100g: Nutrients
  createdAt: string
}
/** at är klockslaget i minuter efter midnatt då måltiden loggades. */
type Planned = { meal: Meal; portion: Portion; at: number }

const tdee = (kg: number, age: number) =>
  (10 * kg + 6.25 * PERSON.heightCm - 5 * age + 5) * PERSON.activityFactor

const phaseAt = (day: number): Phase => PHASES.findLast((ph) => day >= ph.from) ?? PHASES[0]

function planDay(rnd: Random, ctx: DayContext, day: number, feast: Feast | undefined, refs: Map<number | string, FoodRef>) {
  const usable = (t: Template) => t.items.every((i) => (refs.get(i.food)?.since ?? Infinity) <= day)
  const weekendDay = ctx.weekday === 0 || ctx.weekday === 6
  const take = (meal: Meal, items: Portion[], minutes: number) => {
    const at = minutes + Math.round(rnd.normal(0, 25))
    return items.filter((i) => i.p === undefined || rnd.chance(i.p)).map((portion) => ({ meal, portion, at }))
  }
  const fromTemplates = (meal: Meal, templates: readonly Template[], minutes: number) =>
    take(meal, pickWeighted(rnd, templates, ctx, usable).items, minutes)

  const planned: Planned[] = [
    ...fromTemplates('breakfast', BREAKFASTS, MEAL_MINUTES.breakfast + (weekendDay ? 100 : 0)),
    ...(feast?.lunch ? take('lunch', feast.lunch, 780) : fromTemplates('lunch', LUNCHES, MEAL_MINUTES.lunch)),
    ...(feast?.dinner ? take('dinner', feast.dinner, 1140) : fromTemplates('dinner', DINNERS, MEAL_MINUTES.dinner)),
  ]
  const snackCount = rnd.chance(0.15) ? 0 : rnd.int(1, ctx.phase === 'lose' ? 2 : 3)
  for (let i = 0; i < snackCount; i++) planned.push(...fromTemplates('snack', SNACKS, MEAL_MINUTES.snack[i]!))
  const fridayNight = (ctx.weekday === 5 || ctx.weekday === 6) && rnd.chance(ctx.phase === 'lose' ? 0.45 : 0.75)
  if (fridayNight) planned.push(...fromTemplates('snack', TREATS, 1260))
  if (feast?.snack) planned.push(...take('snack', feast.snack, 960))
  return planned
}

/** Skalar portionerna mot dagens kalorier och avrundar som man gör när man väger. */
function portionGrams(rnd: Random, planned: Planned[], targetKcal: number | null, refs: Map<number | string, FoodRef>) {
  const kcal = (pl: Planned, grams: number) => (refs.get(pl.portion.food)!.per100g.kcal * grams) / 100
  const raw = planned.map((pl) => (pl.portion.fixed ? pl.portion.grams : pl.portion.grams * rnd.normal(1, 0.12)))
  const fixedKcal = planned.reduce((sum, pl, i) => sum + (pl.portion.fixed ? kcal(pl, raw[i]!) : 0), 0)
  const scalableKcal = planned.reduce((sum, pl, i) => sum + (pl.portion.fixed ? 0 : kcal(pl, raw[i]!)), 0)
  const scale = targetKcal === null || scalableKcal === 0 ? 1 : Math.min(1.6, Math.max(0.6, (targetKcal - fixedKcal) / scalableKcal))
  return planned.map((pl, i) => {
    if (pl.portion.fixed) return pl.portion.grams
    const step = pl.portion.step ?? (pl.portion.grams >= 100 ? 10 : 5)
    return Math.max(step, Math.round((raw[i]! * scale) / step) * step)
  })
}

/** Lokal tid, som när posten loggas i appen. Delarna i en måltid loggas med någon minuts mellanrum. */
function timestamp(rnd: Random, date: string, at: number, index: number) {
  const [y, mo, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(y, mo - 1, d, 0, at + index, rnd.int(0, 59)).toISOString()
}

function dayFactor(rnd: Random, ctx: DayContext) {
  const byWeekday = [1.05, 0.97, 0.96, 0.97, 0.98, 1.06, 1.14][ctx.weekday]!
  return byWeekday * rnd.normal(1, ctx.phase === 'lose' ? 0.07 : 0.1) * (ctx.phase === 'maintain' ? 1.03 : 1)
}

function simulate(rnd: Random, start: number, days: number, refs: Map<number | string, FoodRef>, morning: boolean) {
  const startYear = new Date(start).getUTCFullYear()
  const years = Array.from({ length: Math.ceil(days / 365) + 1 }, (_, i) => startYear + i)
  const feasts = feastDays(years)
  const vacation = vacationDays(years)
  const entries: Entry[] = []
  const weights: { date: string; kg: number; createdAt: string }[] = []
  const goals = new Map<Phase, number>()
  let kg = PERSON.startKg
  let slump = 0

  for (let day = 0; day < days; day++) {
    const ms = start + day * DAY_MS
    const date = toIso(ms)
    const weekday = new Date(ms).getUTCDay()
    const month = new Date(ms).getUTCMonth() + 1
    const phase = phaseAt(day)
    const age = PERSON.ageAtEnd - (days - day) / 365.25
    const ctx: DayContext = { weekday, month, phase: phase.objective.kind }
    const burn = tdee(kg, age)
    // Målet räknas om när fasen börjar, utifrån vikten då, som när man byter mål i appen
    if (!goals.has(phase)) goals.set(phase, Math.round((tdee(kg, age) + phase.kcalPerDay) / 10) * 10)
    const goalKcal = goals.get(phase)!

    const feastName = feasts.get(date)
    const feast = feastName ? FEASTS[feastName] : undefined
    const holiday = feastName === 'julafton' || feastName === 'juldagen' || feastName === 'nyarsafton'
    if (slump === 0 && phase.objective.kind === 'maintain' && rnd.chance(0.012)) slump = rnd.int(7, 20)
    const rate = vacation.has(date) ? 0 : slump > 0 ? 0.3 : holiday ? 0.75 : phase.logRate - Math.min(0.12, (day - phase.from) * 0.00015)
    if (slump > 0) slump--
    // Med --morning är sista dagen påbörjad och har bara frukosten loggad
    const started = morning && day === days - 1
    const logged = rnd.chance(rate) || started

    let intake = burn * rnd.normal(vacation.has(date) ? 1.18 : 1.08, 0.12)
    if (logged) {
      const planned = planDay(rnd, ctx, day, feast, refs)
      const forgotDinner = !feast && rnd.chance(0.04)
      const kept = started
        ? planned.filter((pl) => pl.meal === 'breakfast')
        : forgotDinner
          ? planned.filter((pl) => pl.meal === 'breakfast' || pl.meal === 'lunch')
          : planned
      const grams = portionGrams(rnd, kept, feast || started ? null : goalKcal * dayFactor(rnd, ctx), refs)
      let loggedKcal = 0
      kept.forEach((pl, i) => {
        const food = refs.get(pl.portion.food)!
        loggedKcal += (food.per100g.kcal * grams[i]!) / 100
        entries.push({
          id: rnd.uuid(),
          date,
          meal: pl.meal,
          foodId: food.id,
          foodName: food.name,
          grams: grams[i]!,
          per100g: food.per100g,
          createdAt: timestamp(rnd, date, pl.at, i),
        })
      })
      // Matolja, smakbitar och det som aldrig loggas
      intake = forgotDinner ? loggedKcal + burn * 0.4 : loggedKcal * rnd.normal(1.07, 0.04)
    }
    kg += (intake - burn) / KCAL_PER_KG

    const weighRate = vacation.has(date) ? 0 : phase.objective.kind === 'maintain' ? 0.15 : weekday === 1 ? 0.9 : 0.45
    if (rnd.chance(weighRate)) {
      const water = rnd.normal(0, 0.35) + (weekday === 1 || weekday === 0 ? 0.3 : 0)
      const [y, mo, d] = date.split('-').map(Number) as [number, number, number]
      const createdAt = new Date(y, mo - 1, d, 6, 40 + rnd.int(0, 30)).toISOString()
      weights.push({ date, kg: Math.round((kg + water) * 10) / 10, createdAt })
    }
  }
  const finalPhase = phaseAt(days - 1)
  return { entries, weights, goalKcal: goals.get(finalPhase)!, objective: finalPhase.objective }
}

// --- Utdata -------------------------------------------------------------

async function main() {
  const { values } = parseArgs({
    options: {
      years: { type: 'string', default: '2' },
      end: { type: 'string', default: toIso(Date.now()) },
      seed: { type: 'string', default: '1' },
      out: { type: 'string', default: 'demo/mumsa-demo.json' },
      morning: { type: 'boolean', default: false },
    },
  })
  const years = Number(values.years)
  if (!(years > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(values.end)) throw new Error('Ange --years > 0 och --end som YYYY-MM-DD.')
  const days = Math.round(years * 365.25)
  const end = parseIso(values.end)
  const start = end - (days - 1) * DAY_MS
  const rnd = makeRandom(Number(values.seed))

  const { refs, foods, recipes } = await loadFoods(rnd, start)
  const { entries, weights, goalKcal, objective } = simulate(rnd, start, days, refs, values.morning)
  const latestKg = weights[weights.length - 1]?.kg ?? PERSON.startKg
  const split = objective.kind === 'lose' ? { proteinPct: 30, carbsPct: 40, fatPct: 30 } : { proteinPct: 25, carbsPct: 45, fatPct: 30 }

  const data = {
    app: 'mumsa',
    version: EXPORT_VERSION,
    exportedAt: new Date(end + (values.morning ? 9 : 20) * 3_600_000).toISOString(),
    foods,
    entries,
    goals: { kcal: goalKcal, split, objective, targetWeightKg: TARGET_KG },
    profile: { weightKg: latestKg, heightCm: PERSON.heightCm, ageYears: PERSON.ageAtEnd, sex: PERSON.sex, activity: PERSON.activity },
    weights,
    recipes,
    favorites: [],
  }
  await mkdir(dirname(values.out), { recursive: true })
  const text = JSON.stringify(data)
  await writeFile(values.out, text)

  const loggedDays = new Set(entries.map((e) => e.date)).size
  console.log(
    `${values.out}: ${toIso(start)} – ${values.end}, ${loggedDays} av ${days} dagar loggade, ` +
      `${entries.length} loggposter, ${recipes.length} recept, ${weights.length} vägningar, ` +
      `${PERSON.startKg} → ${latestKg} kg, ${(text.length / 1024 / 1024).toFixed(1)} MB`,
  )
}

await main()
