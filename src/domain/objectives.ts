import { DEFAULT_SPLIT } from './goals'
import { OBJECTIVE_KINDS, PACES, type MacroSplit, type Objective, type ObjectiveKind, type Pace } from './types'

/** Tumregel: ungefär så mycket energi motsvarar ett kilo kroppsvikt. Hur kroppen faktiskt svarar varierar. */
export const KCAL_PER_KG = 7700

export const PACE_KG_PER_WEEK: Readonly<Record<Pace, number>> = { slow: 0.25, moderate: 0.5 }

export const MAINTAIN: Objective = { kind: 'maintain' }

/** Riktning för viktförändringen: −1 ner, 0 oförändrad, 1 upp. */
const DIRECTION: Readonly<Record<ObjectiveKind, -1 | 0 | 1>> = { lose: -1, maintain: 0, gain: 1, build_muscle: 1 }

/** Utgångspunkter för fördelningen när målet byts. Användaren kan ändra dem fritt. */
const SUGGESTED_SPLITS: Readonly<Record<ObjectiveKind, MacroSplit>> = {
  lose: { proteinPct: 30, carbsPct: 40, fatPct: 30 },
  maintain: DEFAULT_SPLIT,
  gain: DEFAULT_SPLIT,
  build_muscle: { proteinPct: 30, carbsPct: 45, fatPct: 25 },
}

/** Mål utan takt får maintain, övriga får vald takt. */
export function makeObjective(kind: ObjectiveKind, pace: Pace): Objective {
  return kind === 'maintain' ? MAINTAIN : { kind, pace }
}

/** Ungefärlig viktförändring per vecka i kg som målet räknar med. Negativ vid viktnedgång. */
export function weeklyWeightChange(objective: Objective): number {
  return objective.kind === 'maintain' ? 0 : DIRECTION[objective.kind] * PACE_KG_PER_WEEK[objective.pace]
}

/** Underskott (negativt) eller överskott i kcal per dag för att nå takten enligt tumregeln. */
export function dailyKcalAdjustment(objective: Objective): number {
  return (weeklyWeightChange(objective) * KCAL_PER_KG) / 7
}

/** Uppskattat behov justerat efter målet. En uppskattning, inte ett råd. */
export function adjustedDailyKcal(estimate: number, objective: Objective): number {
  return estimate + dailyKcalAdjustment(objective)
}

export function suggestedSplit(kind: ObjectiveKind): MacroSplit {
  return SUGGESTED_SPLITS[kind]
}

export function isValidObjective(v: unknown): v is Objective {
  if (typeof v !== 'object' || v === null) return false
  const { kind, pace } = v as Record<string, unknown>
  if (!(OBJECTIVE_KINDS as readonly unknown[]).includes(kind)) return false
  return kind === 'maintain' ? pace === undefined : (PACES as readonly unknown[]).includes(pace)
}
