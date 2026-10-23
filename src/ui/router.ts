import { useSyncExternalStore } from 'react'
import { isIsoDate, toIsoDate } from '../domain/dates'
import { defaultMealForHour } from '../domain/meals'
import type { IsoDate, Meal } from '../domain/types'

export type Route =
  | { name: 'day'; date: IsoDate }
  | { name: 'add'; date: IsoDate; meal: Meal }
  | { name: 'week'; date: IsoDate }
  | { name: 'profile' }

const MEAL_SLUGS: Record<Meal, string> = {
  breakfast: 'frukost',
  lunch: 'lunch',
  dinner: 'middag',
  snack: 'mellanmal',
}

function mealFromSlug(slug: string | undefined): Meal | undefined {
  return (Object.keys(MEAL_SLUGS) as Meal[]).find((m) => MEAL_SLUGS[m] === slug)
}

/** Lägg till-vyn för idag med den måltid som passar tiden på dygnet. */
export function addRouteNow(now: Date): Route {
  return { name: 'add', date: toIsoDate(now), meal: defaultMealForHour(now.getHours()) }
}

export function parseHash(hash: string, now: Date): Route {
  const [section, param, extra] = hash.replace(/^#\/?/, '').split('/')
  const today = toIsoDate(now)
  const date = param && isIsoDate(param) ? param : today
  switch (section) {
    case 'lagg-till': {
      const meal = mealFromSlug(extra)
      return meal && param && isIsoDate(param) ? { name: 'add', date, meal } : addRouteNow(now)
    }
    case 'vecka':
      return { name: 'week', date }
    case 'profil':
      return { name: 'profile' }
    default:
      return { name: 'day', date }
  }
}

export function toHash(route: Route): string {
  switch (route.name) {
    case 'day':
      return `#/dag/${route.date}`
    case 'add':
      return `#/lagg-till/${route.date}/${MEAL_SLUGS[route.meal]}`
    case 'week':
      return `#/vecka/${route.date}`
    case 'profile':
      return '#/profil'
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
  return parseHash(hash, new Date())
}

export function navigate(route: Route): void {
  window.location.hash = toHash(route)
}
