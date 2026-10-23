import { useSyncExternalStore } from 'react'
import { isIsoDate, toIsoDate } from '../domain/dates'
import type { IsoDate } from '../domain/types'

export type Route =
  | { name: 'day'; date: IsoDate }
  | { name: 'search' }
  | { name: 'week'; date: IsoDate }
  | { name: 'profile' }

export function parseHash(hash: string, today: IsoDate): Route {
  const [section, param] = hash.replace(/^#\/?/, '').split('/')
  const date = param && isIsoDate(param) ? param : today
  switch (section) {
    case 'sok':
      return { name: 'search' }
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
    case 'search':
      return '#/sok'
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
  return parseHash(hash, toIsoDate(new Date()))
}

export function navigate(route: Route): void {
  window.location.hash = toHash(route)
}
