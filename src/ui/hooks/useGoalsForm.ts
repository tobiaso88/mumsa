import { useState } from 'react'
import { bmr, DEFAULT_SPLIT, estimateDailyKcal, isValidGoalKcal, isValidProfile, isValidSplit } from '../../domain/goals/goals'
import { adjustedDailyKcal, dailyKcalAdjustment, makeObjective, suggestedSplit, weeklyWeightChange } from '../../domain/goals/objectives'
import type { ActivityLevel, Goals, MacroSplit, ObjectiveKind, Pace, Profile, Sex } from '../../domain/types'
import { isValidWeightKg } from '../../domain/weight/weight'
import { parseNumber, toInputText } from '../format'

export type GoalMode = 'manual' | 'calculated'

export type GoalsFormState = {
  mode: GoalMode
  kcal: string
  protein: string
  carbs: string
  fat: string
  weight: string
  height: string
  age: string
  sex: Sex | ''
  activity: ActivityLevel
  objective: ObjectiveKind
  pace: Pace
  targetWeight: string
}

export type GoalsFormSet = <K extends keyof GoalsFormState>(key: K, value: GoalsFormState[K]) => void

function initialState(goals: Goals | null, profile: Profile | null): GoalsFormState {
  const split = goals?.split ?? DEFAULT_SPLIT
  const objective = goals?.objective
  return {
    mode: goals && !profile ? 'manual' : 'calculated',
    kcal: toInputText(goals?.kcal),
    protein: toInputText(split.proteinPct),
    carbs: toInputText(split.carbsPct),
    fat: toInputText(split.fatPct),
    weight: toInputText(profile?.weightKg),
    height: toInputText(profile?.heightCm),
    age: toInputText(profile?.ageYears),
    sex: profile?.sex ?? '',
    activity: profile?.activity ?? 'light',
    objective: objective?.kind ?? 'maintain',
    pace: objective && objective.kind !== 'maintain' ? objective.pace : 'slow',
    targetWeight: toInputText(goals?.targetWeightKg),
  }
}

function readProfile(s: GoalsFormState): Profile | null {
  if (s.sex === '') return null
  const profile: Profile = {
    weightKg: parseNumber(s.weight),
    heightCm: parseNumber(s.height),
    ageYears: parseNumber(s.age),
    sex: s.sex,
    activity: s.activity,
  }
  return isValidProfile(profile) ? profile : null
}

/** Målvikt är frivillig. undefined om fältet är tomt eller målet är att behålla vikten, null om den är ogiltig. */
function readTargetWeight(s: GoalsFormState): number | undefined | null {
  if (s.objective === 'maintain' || s.targetWeight.trim() === '') return undefined
  const kg = parseNumber(s.targetWeight)
  return isValidWeightKg(kg) ? kg : null
}

/** Uppskattningen och hur målet justerar den. null tills profilen är ifylld. */
export type Estimate = {
  /** Uppskattad förbrukning per dag. */
  maintenance: number
  /** Underskott (negativt) eller överskott per dag. */
  adjustment: number
  weeklyChangeKg: number
  /** Basalomsättningen, för att kunna upplysa om att målet ligger under den. */
  bmr: number
}

/** Formulärstate för mål och profil. All tolkning och validering sker här, inte i komponenterna. */
export function useGoalsForm(goals: Goals | null, profile: Profile | null) {
  const [state, setState] = useState(() => initialState(goals, profile))

  const set: GoalsFormSet = (key, value) => setState((s) => ({ ...s, [key]: value }))

  /** Byte av mål fyller i en fördelning som utgångspunkt. */
  const setObjective = (kind: ObjectiveKind) => {
    const split = suggestedSplit(kind)
    setState((s) => ({
      ...s,
      objective: kind,
      protein: toInputText(split.proteinPct),
      carbs: toInputText(split.carbsPct),
      fat: toInputText(split.fatPct),
    }))
  }

  const split: MacroSplit = {
    proteinPct: parseNumber(state.protein),
    carbsPct: parseNumber(state.carbs),
    fatPct: parseNumber(state.fat),
  }
  const splitValid = isValidSplit(split)
  const objective = makeObjective(state.objective, state.pace)
  const parsedProfile = readProfile(state)
  const estimate: Estimate | null = parsedProfile
    ? {
        maintenance: estimateDailyKcal(parsedProfile),
        adjustment: dailyKcalAdjustment(objective),
        weeklyChangeKg: weeklyWeightChange(objective),
        bmr: bmr(parsedProfile),
      }
    : null
  const calculated = state.mode === 'calculated'
  const kcal =
    calculated && estimate !== null ? Math.round(adjustedDailyKcal(estimate.maintenance, objective)) : parseNumber(state.kcal)
  const kcalValid = isValidGoalKcal(kcal)
  const targetWeightKg = readTargetWeight(state)
  const targetWeightValid = targetWeightKg !== null

  const valid = splitValid && kcalValid && targetWeightValid && (!calculated || parsedProfile)
  const result = valid
    ? {
        goals: { kcal, split, objective, ...(targetWeightKg !== undefined && { targetWeightKg }) } satisfies Goals,
        profile: calculated ? parsedProfile : null,
      }
    : null

  return { state, set, setObjective, split, splitValid, kcal, kcalValid, estimate, targetWeightValid, parsedProfile, result }
}
