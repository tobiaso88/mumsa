import { useSyncExternalStore } from 'react'
import { isIsoDate, toIsoDate } from '../domain/dates'
import { defaultMealForHour } from '../domain/meals'
import type { IsoDate, Meal } from '../domain/types'
import { useToday } from './todayContext'

/** Var användaren befinner sig i lägg till-flödet, så att man kan återvända dit. */
export type AddContext = { date: IsoDate; meal: Meal }

export type FoodFormAction = 'new' | 'copy' | 'edit'

/** Ett nytt livsmedel kan få en streckkod i förväg. Att kopiera eller ändra kräver ett befintligt livsmedel. */
export type FoodFormTarget = { action: 'new'; barcode?: string } | { action: 'copy' | 'edit'; foodId: string }

export type Route =
  | { name: 'day'; date: IsoDate }
  | ({ name: 'add'; foodId?: string } & AddContext)
  | ({ name: 'scan' } & AddContext)
  | ({ name: 'food' } & FoodFormTarget & AddContext)
  | { name: 'week'; date: IsoDate }
  | { name: 'profile' }
  | { name: 'settings' }

const MEAL_SLUGS: Record<Meal, string> = {
  breakfast: 'frukost',
  lunch: 'lunch',
  dinner: 'middag',
  snack: 'mellanmal',
}

const FOOD_ACTION_SLUGS: Record<FoodFormAction, string> = { new: 'ny', copy: 'kopiera', edit: 'andra' }

function fromSlug<T extends string>(slugs: Record<T, string>, slug: string | undefined): T | undefined {
  return (Object.keys(slugs) as T[]).find((key) => slugs[key] === slug)
}

function addContextNow(now: Date): AddContext {
  return { date: toIsoDate(now), meal: defaultMealForHour(now.getHours()) }
}

/** Lägg till-vyn för idag med den måltid som passar tiden på dygnet. */
export function addRouteNow(now: Date): Route {
  return { name: 'add', ...addContextNow(now) }
}

function parseAddContext(date: string | undefined, meal: string | undefined): AddContext | undefined {
  const parsedMeal = fromSlug(MEAL_SLUGS, meal)
  return date && isIsoDate(date) && parsedMeal ? { date, meal: parsedMeal } : undefined
}

function decode(part: string | undefined): string | undefined {
  return part ? decodeURIComponent(part) : undefined
}

export function parseHash(hash: string, now: Date): Route {
  const parts = hash.replace(/^#\/?/, '').split('/')
  const [section, first, second, third, fourth] = parts
  const date = first && isIsoDate(first) ? first : toIsoDate(now)
  switch (section) {
    case 'lagg-till': {
      const context = parseAddContext(first, second)
      return context ? { name: 'add', ...context, foodId: decode(third) } : addRouteNow(now)
    }
    case 'skanna':
      return { name: 'scan', ...(parseAddContext(first, second) ?? addContextNow(now)) }
    case 'livsmedel': {
      const action = fromSlug(FOOD_ACTION_SLUGS, first) ?? 'new'
      const context = parseAddContext(second, third) ?? addContextNow(now)
      const ref = decode(fourth)
      if (action === 'new') return { name: 'food', action, ...context, barcode: ref }
      return ref ? { name: 'food', action, ...context, foodId: ref } : { name: 'add', ...context }
    }
    case 'vecka':
      return { name: 'week', date }
    case 'profil':
      return { name: 'profile' }
    case 'installningar':
      return { name: 'settings' }
    default:
      return { name: 'day', date }
  }
}

function contextPath({ date, meal }: AddContext): string {
  return `${date}/${MEAL_SLUGS[meal]}`
}

function optional(part: string | undefined): string {
  return part ? `/${encodeURIComponent(part)}` : ''
}

export function toHash(route: Route): string {
  switch (route.name) {
    case 'day':
      return `#/dag/${route.date}`
    case 'add':
      return `#/lagg-till/${contextPath(route)}${optional(route.foodId)}`
    case 'scan':
      return `#/skanna/${contextPath(route)}`
    case 'food': {
      const ref = route.action === 'new' ? route.barcode : route.foodId
      return `#/livsmedel/${FOOD_ACTION_SLUGS[route.action]}/${contextPath(route)}${optional(ref)}`
    }
    case 'week':
      return `#/vecka/${route.date}`
    case 'profile':
      return '#/profil'
    case 'settings':
      return '#/installningar'
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getHash() {
  return window.location.hash
}

/** Aktuell vy, läst från adressens hash så att bakåtknappen fungerar. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash)
  // Prenumererar på dagens datum så att vyer utan datum i adressen byter dag vid midnatt
  useToday()
  return parseHash(hash, new Date())
}

export function navigate(route: Route): void {
  window.location.hash = toHash(route)
}
