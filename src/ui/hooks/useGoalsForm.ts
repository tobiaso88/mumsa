import { useState } from 'react'
import { DEFAULT_SPLIT, estimateDailyKcal, isValidGoalKcal, isValidProfile, isValidSplit } from '../../domain/goals'
import type { ActivityLevel, Goals, MacroSplit, Profile, Sex } from '../../domain/types'
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
}

function initialState(goals: Goals | null, profile: Profile | null): GoalsFormState {
  const split = goals?.split ?? DEFAULT_SPLIT
  return {
    mode: goals && !profile ? 'manual' : 'calculated',
    kcal: toInputText(goals?.kcal),
    protein: String(split.proteinPct),
    carbs: String(split.carbsPct),
    fat: String(split.fatPct),
    weight: toInputText(profile?.weightKg),
    height: toInputText(profile?.heightCm),
    age: toInputText(profile?.ageYears),
    sex: profile?.sex ?? '',
    activity: profile?.activity ?? 'light',
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

/** Formulärstate för mål och profil. All tolkning och validering sker här, inte i komponenterna. */
export function useGoalsForm(goals: Goals | null, profile: Profile | null) {
  const [state, setState] = useState(() => initialState(goals, profile))

  const set = <K extends keyof GoalsFormState>(key: K, value: GoalsFormState[K]) =>
    setState((s) => ({ ...s, [key]: value }))

  const split: MacroSplit = {
    proteinPct: parseNumber(state.protein),
    carbsPct: parseNumber(state.carbs),
    fatPct: parseNumber(state.fat),
  }
  const splitValid = isValidSplit(split)
  const parsedProfile = readProfile(state)
  const estimate = parsedProfile ? estimateDailyKcal(parsedProfile) : null
  const kcal = state.mode === 'calculated' && estimate !== null ? Math.round(estimate) : parseNumber(state.kcal)
  const kcalValid = isValidGoalKcal(kcal)
  const profileNeeded = state.mode === 'calculated'

  const result =
    splitValid && kcalValid && (!profileNeeded || parsedProfile)
      ? { goals: { kcal, split }, profile: profileNeeded ? parsedProfile : null }
      : null

  return { state, set, split, splitValid, kcal, kcalValid, estimate, parsedProfile, result }
}
