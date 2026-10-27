import { isValidBarcode } from './barcode'
import { isIsoDate } from './dates'
import { idMatchesSource } from './foodIds'
import { MAX_TEXT_LENGTH, nutrientIssues } from './foodValidation'
import { isValidGoalKcal, isValidProfile, isValidSplit } from './goals'
import { isValidAmount } from './nutrition'
import {
  ACTIVITY_LEVELS,
  FOOD_SOURCES,
  MEALS,
  SEXES,
  type Food,
  type Goals,
  type LogEntry,
  type Nutrients,
  type Profile,
} from './types'

export const EXPORT_VERSION = 1

export type ExportData = {
  app: 'mumsa'
  /** Formatets version. Äldre versioner uppgraderas med migrateExport innan de valideras. */
  version: number
  exportedAt: string
  foods: Food[]
  entries: LogEntry[]
  goals: Goals | null
  profile: Profile | null
}

export type ImportResult =
  | {
      ok: true
      data: ExportData
      /** Livsmedel från Livsmedelsverket som hoppades över eftersom de redan är buntade med appen. */
      skippedFoods: number
    }
  | { ok: false; error: string }

type Obj = Record<string, unknown>

/** Uppgraderar en export från version n till n + 1. */
export type Migration = (json: Record<string, unknown>) => Record<string, unknown>

/** Ett steg läggs till här varje gång exportformatet ändras, med den gamla versionen som nyckel. */
const MIGRATIONS: Readonly<Partial<Record<number, Migration>>> = {}

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isNonNegNum = (v: unknown): v is number => isNum(v) && v >= 0
const isStr = (v: unknown): v is string => typeof v === 'string'
const isText = (v: unknown): v is string => isStr(v) && v.length <= MAX_TEXT_LENGTH
const isOptText = (v: unknown) => v === undefined || isText(v)
/** Id och namn får inte vara tomma. */
const isNonEmptyText = (v: unknown): v is string => isText(v) && v.trim() !== ''
const isTimestamp = (v: unknown): v is string => isStr(v) && !Number.isNaN(Date.parse(v))
const isOneOf = <T>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v)

/** Samma gränser som när ett livsmedel sparas i formuläret. */
function isNutrients(v: unknown): v is Nutrients {
  return (
    isObj(v) &&
    isNonNegNum(v.kcal) &&
    isNonNegNum(v.protein) &&
    isNonNegNum(v.carbs) &&
    isNonNegNum(v.fat) &&
    nutrientIssues(v as Nutrients).length === 0
  )
}

function isFood(v: unknown): v is Food {
  return (
    isObj(v) &&
    isNonEmptyText(v.id) &&
    isNonEmptyText(v.name) &&
    isOptText(v.brand) &&
    (v.barcode === undefined || (isStr(v.barcode) && isValidBarcode(v.barcode))) &&
    isOneOf(FOOD_SOURCES, v.source) &&
    idMatchesSource(v.id, v.source) &&
    isNutrients(v.per100g) &&
    (v.servingGrams === undefined || (isNum(v.servingGrams) && isValidAmount(v.servingGrams))) &&
    isOptText(v.servingLabel) &&
    isTimestamp(v.updatedAt)
  )
}

function isEntry(v: unknown): v is LogEntry {
  return (
    isObj(v) &&
    isNonEmptyText(v.id) &&
    isIsoDate(v.date) &&
    isOneOf(MEALS, v.meal) &&
    isNonEmptyText(v.foodId) &&
    isNonEmptyText(v.foodName) &&
    isNum(v.grams) &&
    isValidAmount(v.grams) &&
    isNutrients(v.per100g) &&
    isTimestamp(v.createdAt)
  )
}

function isGoals(v: unknown): v is Goals {
  return (
    isObj(v) &&
    isNum(v.kcal) &&
    isValidGoalKcal(v.kcal) &&
    isObj(v.split) &&
    isNum(v.split.proteinPct) &&
    isNum(v.split.carbsPct) &&
    isNum(v.split.fatPct) &&
    isValidSplit(v.split as Goals['split'])
  )
}

function isProfile(v: unknown): v is Profile {
  return (
    isObj(v) &&
    isNum(v.weightKg) &&
    isNum(v.heightCm) &&
    isNum(v.ageYears) &&
    isOneOf(SEXES, v.sex) &&
    isOneOf(ACTIVITY_LEVELS, v.activity) &&
    isValidProfile(v as Profile)
  )
}

function hasDuplicateIds(items: readonly { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size !== items.length
}

const fail = (error: string): ImportResult => ({ ok: false, error })

export function createExport(
  content: Omit<ExportData, 'app' | 'version' | 'exportedAt'>,
  exportedAt: Date,
): ExportData {
  return { app: 'mumsa', version: EXPORT_VERSION, exportedAt: exportedAt.toISOString(), ...content }
}

/**
 * Uppgraderar en export steg för steg till målversionen. Ger null om
 * versionen saknas, är nyare än målet eller saknar ett steg.
 */
export function migrateExport(
  json: Record<string, unknown>,
  migrations: Readonly<Partial<Record<number, Migration>>> = MIGRATIONS,
  target = EXPORT_VERSION,
): Record<string, unknown> | null {
  let current = json
  while (current.version !== target) {
    const version = current.version
    const step = isNum(version) ? migrations[version] : undefined
    if (!isNum(version) || !step) return null
    current = { ...step(current), version: version + 1 }
  }
  return current
}

/** Kontrollerar en export som redan har aktuell version. */
function validateCurrent(json: Obj): ImportResult {
  if (!Array.isArray(json.foods) || !Array.isArray(json.entries)) return fail('Filen saknar livsmedel eller loggposter.')
  const badFood = json.foods.findIndex((f) => !isFood(f))
  if (badFood !== -1) return fail(`Livsmedel nummer ${badFood + 1} är ogiltigt.`)
  const badEntry = json.entries.findIndex((e) => !isEntry(e))
  if (badEntry !== -1) return fail(`Loggpost nummer ${badEntry + 1} är ogiltig.`)
  const foods = json.foods as Food[]
  const entries = json.entries as LogEntry[]
  if (hasDuplicateIds(foods)) return fail('Filen innehåller flera livsmedel med samma id.')
  if (hasDuplicateIds(entries)) return fail('Filen innehåller flera loggposter med samma id.')
  const goals = json.goals ?? null
  if (goals !== null && !isGoals(goals)) return fail('Målen i filen är ogiltiga.')
  const profile = json.profile ?? null
  if (profile !== null && !isProfile(profile)) return fail('Profilen i filen är ogiltig.')

  // Livsmedelsverkets livsmedel följer med appen och ska inte ligga i databasen
  const stored = foods.filter((f) => f.source !== 'slv')
  return {
    ok: true,
    data: {
      app: 'mumsa',
      version: EXPORT_VERSION,
      exportedAt: isStr(json.exportedAt) ? json.exportedAt : '',
      foods: stored,
      entries,
      goals,
      profile,
    },
    skippedFoods: foods.length - stored.length,
  }
}

/** Kontrollerar att en inläst JSON-struktur är en giltig Mumsa-export och uppgraderar äldre versioner. */
export function validateImport(json: unknown): ImportResult {
  if (!isObj(json) || json.app !== 'mumsa') return fail('Filen är inte en export från Mumsa.')
  if (isNum(json.version) && json.version > EXPORT_VERSION) {
    return fail('Filen kommer från en nyare version av Mumsa. Uppdatera appen och försök igen.')
  }
  const migrated = migrateExport(json)
  if (!migrated) return fail(`Exportversion ${String(json.version)} stöds inte.`)
  return validateCurrent(migrated)
}
