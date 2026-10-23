import { isIsoDate } from './dates'
import { isValidProfile, isValidSplit } from './goals'
import {
  ACTIVITY_LEVELS,
  MEALS,
  type Food,
  type Goals,
  type LogEntry,
  type Nutrients,
  type Profile,
} from './types'

export const EXPORT_VERSION = 1

export type ExportData = {
  app: 'mumsa'
  version: typeof EXPORT_VERSION
  exportedAt: string
  foods: Food[]
  entries: LogEntry[]
  goals: Goals | null
  profile: Profile | null
}

export type ImportResult = { ok: true; data: ExportData } | { ok: false; error: string }

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isNonNegNum = (v: unknown): v is number => isNum(v) && v >= 0
const isStr = (v: unknown): v is string => typeof v === 'string'
const isOptStr = (v: unknown) => v === undefined || isStr(v)

function isNutrients(v: unknown): v is Nutrients {
  return isObj(v) && isNonNegNum(v.kcal) && isNonNegNum(v.protein) && isNonNegNum(v.carbs) && isNonNegNum(v.fat)
}

function isFood(v: unknown): v is Food {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    isOptStr(v.brand) &&
    isOptStr(v.barcode) &&
    (v.source === 'off' || v.source === 'custom') &&
    isNutrients(v.per100g) &&
    (v.servingGrams === undefined || (isNum(v.servingGrams) && v.servingGrams > 0)) &&
    isOptStr(v.servingLabel) &&
    isStr(v.updatedAt)
  )
}

function isEntry(v: unknown): v is LogEntry {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isIsoDate(v.date) &&
    (MEALS as readonly unknown[]).includes(v.meal) &&
    isStr(v.foodId) &&
    isStr(v.foodName) &&
    isNum(v.grams) &&
    v.grams > 0 &&
    isNutrients(v.per100g) &&
    isStr(v.createdAt)
  )
}

function isGoals(v: unknown): v is Goals {
  return (
    isObj(v) &&
    isNum(v.kcal) &&
    v.kcal > 0 &&
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
    (v.sex === 'female' || v.sex === 'male') &&
    (ACTIVITY_LEVELS as readonly unknown[]).includes(v.activity) &&
    isValidProfile(v as Profile)
  )
}

export function createExport(
  content: Omit<ExportData, 'app' | 'version' | 'exportedAt'>,
  exportedAt: Date,
): ExportData {
  return { app: 'mumsa', version: EXPORT_VERSION, exportedAt: exportedAt.toISOString(), ...content }
}

/** Kontrollerar att en inläst JSON-struktur är en giltig Mumsa-export. */
export function validateImport(json: unknown): ImportResult {
  if (!isObj(json) || json.app !== 'mumsa') {
    return { ok: false, error: 'Filen är inte en export från Mumsa.' }
  }
  if (json.version !== EXPORT_VERSION) {
    return { ok: false, error: `Exportversion ${String(json.version)} stöds inte.` }
  }
  if (!Array.isArray(json.foods) || !Array.isArray(json.entries)) {
    return { ok: false, error: 'Filen saknar livsmedel eller loggposter.' }
  }
  const badFood = json.foods.findIndex((f) => !isFood(f))
  if (badFood !== -1) {
    return { ok: false, error: `Livsmedel nummer ${badFood + 1} är ogiltigt.` }
  }
  const badEntry = json.entries.findIndex((e) => !isEntry(e))
  if (badEntry !== -1) {
    return { ok: false, error: `Loggpost nummer ${badEntry + 1} är ogiltig.` }
  }
  const goals = json.goals ?? null
  if (goals !== null && !isGoals(goals)) {
    return { ok: false, error: 'Målen i filen är ogiltiga.' }
  }
  const profile = json.profile ?? null
  if (profile !== null && !isProfile(profile)) {
    return { ok: false, error: 'Profilen i filen är ogiltig.' }
  }
  return {
    ok: true,
    data: {
      app: 'mumsa',
      version: EXPORT_VERSION,
      exportedAt: isStr(json.exportedAt) ? json.exportedAt : '',
      foods: json.foods as Food[],
      entries: json.entries as LogEntry[],
      goals,
      profile,
    },
  }
}
